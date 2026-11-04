const SESSION_DAYS = 7;
const VALID_EVENTS = new Set(["donghak", "march1", "gwangbok", "war", "april19", "june"]);
const SESSION_COOKIE = "history_session";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders },
  });
}

function cookieValue(request, name) {
  const part = (request.headers.get("cookie") || "").split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? part.slice(name.length + 1) : null;
}

function cookieHeader(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashText(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

async function passwordHash(password, salt = base64url(crypto.getRandomValues(new Uint8Array(16)))) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable in the Worker runtime");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120000 }, material, 256);
  return `pbkdf2-sha256$120000$${salt}$${base64url(new Uint8Array(bits))}`;
}

async function checkPassword(password, stored) {
  const [algorithm, iterations, salt, expected] = (stored || "").split("$");
  if (algorithm !== "pbkdf2-sha256" || Number(iterations) !== 120000 || !salt || !expected) return false;
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120000 }, material, 256);
  const actual = base64url(new Uint8Array(bits));
  return actual.length === expected.length && [...actual].reduce((result, char, index) => result | (char.charCodeAt(0) ^ expected.charCodeAt(index)), 0) === 0;
}

async function currentUser(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await hashText(token);
  return env.DB.prepare("SELECT users.id, users.username, users.display_name AS name, users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id_hash = ? AND sessions.expires_at > datetime('now')").bind(tokenHash).first();
}

async function handleApi(request, env, path) {
  console.error("API:entered", request.method, path, "DB", Boolean(env.DB));
  if (!env.DB) return json({ error: "D1 데이터베이스 설정이 완료되지 않았습니다." }, 503);
  if (request.method === "GET" && path === "/api/me") {
    const user = await currentUser(request, env);
    return json({ user: user || null });
  }

  if (request.method === "POST" && path === "/api/auth/signup") {
    return json({ error: "회원 가입은 관리자 초기 설정 후 다시 이용할 수 있도록 준비 중입니다." }, 503);
  }

  if (request.method === "POST" && path === "/api/auth/login") {
    const input = await request.json().catch(() => null);
    const username = typeof input?.username === "string" ? input.username.trim() : "";
    const password = typeof input?.password === "string" ? input.password : "";
    const user = await env.DB.prepare("SELECT id, username, display_name AS name, role, password_hash FROM users WHERE username = ?").bind(username).first();
    if (!user || !(await checkPassword(password, user.password_hash))) return json({ error: "아이디 또는 비밀번호를 확인해주세요." }, 401);
    return createSession(user.id, { id: user.id, username: user.username, name: user.name, role: user.role }, env);
  }

  if (request.method === "POST" && path === "/api/auth/logout") {
    const token = cookieValue(request, SESSION_COOKIE);
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(await hashText(token)).run();
    return json({ ok: true }, 200, { "set-cookie": cookieHeader("", 0) });
  }

  if (request.method === "POST" && path === "/api/admin/claim") {
    if (!env.ADMIN_SETUP_TOKEN) return json({ error: "관리자 초기 설정이 구성되지 않았습니다." }, 503);
    const user = await currentUser(request, env);
    if (!user) return json({ error: "먼저 회원가입 후 로그인해주세요." }, 401);
    const authorization = request.headers.get("authorization") || "";
    if (authorization !== `Bearer ${env.ADMIN_SETUP_TOKEN}`) return json({ error: "관리자 초기 설정 키가 올바르지 않습니다." }, 403);
    const upgraded = await env.DB.prepare("UPDATE users SET role = 'admin' WHERE id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')").bind(user.id).run();
    if (!upgraded.meta.changes) return json({ error: "이미 관리자가 설정되어 있거나, 이 계정을 승격할 수 없습니다." }, 409);
    return json({ user: { ...user, role: "admin" } });
  }

  if (request.method === "GET" && path === "/api/admin/stats") {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "로그인이 필요합니다." }, 401);
    if (user.role !== "admin") return json({ error: "관리자만 이용할 수 있습니다." }, 403);
    const [users, comments] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS count FROM users").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM comments").first(),
    ]);
    return json({ events: VALID_EVENTS.size, users: users.count, comments: comments.count });
  }

  const commentsMatch = path.match(/^\/api\/events\/([a-z0-9]+)\/comments$/);
  if (commentsMatch && VALID_EVENTS.has(commentsMatch[1]) && request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT comments.id, comments.body AS text, comments.created_at AS createdAt, users.display_name AS name FROM comments JOIN users ON users.id = comments.user_id WHERE comments.event_id = ? ORDER BY comments.created_at DESC LIMIT 100").bind(commentsMatch[1]).all();
    return json({ comments: results });
  }
  if (commentsMatch && VALID_EVENTS.has(commentsMatch[1]) && request.method === "POST") {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "댓글을 남기려면 로그인해주세요." }, 401);
    const input = await request.json().catch(() => null);
    const text = typeof input?.text === "string" ? input.text.trim() : "";
    if (text.length < 1 || text.length > 500) return json({ error: "댓글은 1~500자로 입력해주세요." }, 400);
    const created = await env.DB.prepare("INSERT INTO comments (event_id, user_id, body) VALUES (?, ?, ?)").bind(commentsMatch[1], user.id, text).run();
    return json({ comment: { id: created.meta.last_row_id, name: user.name, text, createdAt: new Date().toISOString() } }, 201);
  }

  return json({ error: "요청을 찾을 수 없습니다." }, 404);
}

async function createSession(userId, user, env) {
  const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await hashText(token);
  await env.DB.prepare("INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))").bind(tokenHash, userId, `+${SESSION_DAYS} days`).run();
  return json({ user }, 200, { "set-cookie": cookieHeader(token, SESSION_DAYS * 86400) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url.pathname);
      if (url.pathname === "/") {
        const page = await env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
        if (page.status !== 404) return page;
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Request failed:", error instanceof Error ? error.stack || error.message : String(error));
      return json({ error: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요." }, 500);
    }
  },
};