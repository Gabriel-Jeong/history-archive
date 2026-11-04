"use strict";

const closeDialogButtons = document.querySelectorAll(".dialog-close");
closeDialogButtons.forEach((button) => button.addEventListener("click", () => button.closest("dialog")?.close()));

function setLiveAuth(user) {
  if (typeof currentUser === "undefined") return;
  currentUser = user ? { username: user.username, role: user.role, name: user.name } : null;
  const button = document.querySelector("#login-button");
  if (button) {
    button.innerHTML = currentUser ? `${escapeHTML(currentUser.name)} <span aria-hidden="true">↗</span>` : '로그인 <span aria-hidden="true">↗</span>';
    button.title = currentUser ? "계정 및 관리자 메뉴" : "로그인";
  }
  if (typeof currentEvent !== "undefined" && currentEvent) {
    const input = document.querySelector("#comment-input");
    if (input) input.placeholder = currentUser ? "기억하고 싶은 생각을 나눠주세요." : "로그인 후 댓글을 작성할 수 있습니다.";
    loadServerComments(currentEvent.id);
  }
}

function renderServerComments(eventId, comments) {
  const list = document.querySelector("#comments-list");
  if (!list) return;
  document.querySelector("#comment-count").textContent = String(comments.length).padStart(2, "0");
  list.innerHTML = comments.length ? comments.map((comment) => `<article class="comment-item"><span class="comment-author">${escapeHTML(comment.name)}</span><time class="comment-date">${escapeHTML(new Date(`${comment.createdAt}Z`).toLocaleDateString("ko-KR"))}</time><p class="comment-text">${escapeHTML(comment.text)}</p></article>`).join("") : '<p class="comment-text">아직 댓글이 없습니다. 첫 번째 이야기를 남겨보세요.</p>';
  const card = document.querySelector(`.story-card[data-id="${eventId}"] .story-card-footer span:first-child`);
  if (card) card.textContent = `댓글 ${comments.length}`;
}

async function requestApi(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data;
}

window.requestArchiveApi = requestApi;

async function loadServerComments(eventId) {
  const list = document.querySelector("#comments-list");
  if (!list) return;
  try {
    const { comments } = await requestApi(`/api/events/${encodeURIComponent(eventId)}/comments`);
    renderServerComments(eventId, comments);
  } catch (error) {
    list.innerHTML = `<p class="comment-text">${escapeHTML(error.message)}</p>`;
  }
}

async function refreshCurrentUser() {
  try {
    const { user } = await requestApi("/api/me");
    setLiveAuth(user);
  } catch {
    setLiveAuth(null);
  }
}

document.querySelector("#login-button")?.addEventListener("click", async (event) => {
  if (!currentUser) return;
  event.stopImmediatePropagation();
  if (currentUser.role === "admin") {
    try {
      const stats = await requestApi("/api/admin/stats");
      document.querySelector("#admin-stats").innerHTML = `<div class="admin-stat"><span>등록된 사건</span><strong>${Number(stats.events)}</strong></div><div class="admin-stat"><span>회원</span><strong>${Number(stats.users)}</strong></div><div class="admin-stat"><span>게시된 댓글</span><strong>${Number(stats.comments)}</strong></div>`;
      document.querySelector("#admin-dialog").showModal();
    } catch (error) {
      showToast(error.message);
    }
  } else {
    try {
      await requestApi("/api/auth/logout", { method: "POST", body: "{}" });
      setLiveAuth(null);
      showToast("로그아웃했습니다.");
    } catch (error) {
      showToast(error.message);
    }
  }
});

document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorElement = document.querySelector("#login-error");
  const button = document.querySelector("#login-submit");
  const mode = document.querySelector("#login-title").textContent.includes("새로운") ? "signup" : "login";
  button.disabled = true;
  errorElement.textContent = "";
  try {
    const result = await requestApi(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({ username: document.querySelector("#login-email").value.trim(), password: document.querySelector("#login-password").value }),
    });
    setLiveAuth(result.user);
    document.querySelector("#login-dialog").close();
    event.currentTarget.reset();
    showToast(`${escapeHTML(result.user.name)}님, 환영합니다.`);
  } catch (error) {
    errorElement.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#comment-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    document.querySelector("#story-dialog").close();
    showLogin();
    showToast("댓글을 남기려면 먼저 로그인해주세요.");
    return;
  }
  const text = document.querySelector("#comment-input").value.trim();
  if (!text || !currentEvent) return;
  try {
    await requestApi(`/api/events/${encodeURIComponent(currentEvent.id)}/comments`, { method: "POST", body: JSON.stringify({ text }) });
    document.querySelector("#comment-input").value = "";
    await loadServerComments(currentEvent.id);
    renderEvents();
    showToast("댓글을 남겼습니다.");
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector("#login-dialog")?.addEventListener("close", () => {
  const form = document.querySelector("#login-form");
  if (form) form.reset();
});

refreshCurrentUser();

document.addEventListener("click", (event) => {
  if (event.target.closest(".story-card[data-id]") && typeof currentEvent !== "undefined" && currentEvent) loadServerComments(currentEvent.id);
});

if (typeof renderEvents === "function") {
  const initialRenderEvents = renderEvents;
  renderEvents = function renderEventsWithServerCommentCounts(...args) {
    initialRenderEvents(...args);
    for (const card of document.querySelectorAll(".story-card[data-id]")) {
      requestApi(`/api/events/${encodeURIComponent(card.dataset.id)}/comments`)
        .then(({ comments }) => renderServerComments(card.dataset.id, comments))
        .catch(() => {});
    }
  };
  renderEvents();
}