const detailContainer = document.getElementById("detail");
const likeBtn = document.getElementById("likeBtn");
const deleteBtn = document.getElementById("deleteBtn");
const editLink = document.getElementById("editLink");

// ログイン情報取得
function safeGetLoginUser() {
  try {
    if (typeof getLoginUser === "function") return getLoginUser();
    const raw = localStorage.getItem("loginUser");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("login user read error:", e);
    return null;
  }
}

function formatDateTimeLong(dtString) {
  if (!dtString) return "日時不明";

  const d = new Date(dtString);

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");

  return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

const loginUser = safeGetLoginUser();
const loginUserId = loginUser?.name || loginUser?.username || null;

// URLから投稿ID取得
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  detailContainer.innerHTML = `<p class="empty-message">不正なアクセスです。</p>`;
  throw new Error("id がありません");
}

async function loadDetail() {
  detailContainer.innerHTML = `<p class="empty-message">読み込み中...</p>`;

  try {
    const res = await fetch(`${API_BASE}/posts/${id}`);
    if (!res.ok) throw new Error(`detail fetch failed: ${res.status}`);

    const post = await res.json();
    console.log("detail post:", post);

    detailContainer.innerHTML = `
      <div class="post-card">
        <img src="${post.image_url}" alt="${post.fish ?? "投稿画像"}" />
        <div class="post-content">
          <h2 class="post-title">${post.fish ?? "不明"} ${post.size ?? "?"}cm</h2>

          <p class="post-meta">👤 ${post.user_name ?? "不明"}</p>
          <p class="post-meta">📍 ${post.place ?? "不明"}</p>
          <p class="post-meta">🕒 ${formatDateTimeLong(post.created_at)}</p>

          <p class="post-meta">🌤 天気: ${post.weather ?? "情報なし"}</p>
          <p class="post-meta">🌡 気温: ${post.temperature ?? "?"}℃</p>
          <p class="post-meta">💨 風: ${post.wind_speed ?? "?"} m/s / ${post.wind_direction ?? "不明"}</p>
          <p class="post-meta">🌊 潮: ${post.tide ?? "情報なし"}</p>
          <p class="post-meta">🌙 月齢: ${post.moon_age ?? "情報なし"}</p>
          <p class="post-meta">❤️ <span id="likeCount">${post.likes ?? 0}</span></p>
        </div>
      </div>
    `;

    if (loginUserId && likeBtn) {
      const likedRes = await fetch(
        `${API_BASE}/posts/${id}/liked?user_id=${encodeURIComponent(loginUserId)}`
      );
      if (likedRes.ok) {
        const likedData = await likedRes.json();
        if (likedData.liked) {
          likeBtn.textContent = "いいね済み ❤️";
          likeBtn.disabled = true;
        }
      }
    }

    const loginName = loginUser?.name || loginUser?.username || null;
    const isOwner = loginName && post.user_name === loginName;

    if (editLink) {
      editLink.style.display = isOwner ? "block" : "none";
      if (isOwner) editLink.href = `./edit.html?id=${id}`;
    }

    if (deleteBtn) {
      deleteBtn.style.display = isOwner ? "block" : "none";
    }
  } catch (err) {
    console.error("loadDetail error:", err);
    detailContainer.innerHTML = `<p class="empty-message">読み込み失敗</p>`;
  }
}

loadDetail();

if (likeBtn) {
  likeBtn.addEventListener("click", async () => {
    if (!loginUserId) {
      alert("ログインしてください");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("user_id", loginUserId);

      const res = await fetch(`${API_BASE}/posts/${id}/like`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error("like failed");

      const likeCount = document.getElementById("likeCount");
      if (likeCount) likeCount.textContent = data.likes ?? 0;

      likeBtn.textContent = "いいね済み ❤️";
      likeBtn.disabled = true;
    } catch (err) {
      console.error("like error:", err);
      alert("いいね失敗");
    }
  });
}

if (deleteBtn) {
  deleteBtn.addEventListener("click", async () => {
    if (!loginUser) {
      alert("ログインしてください");
      return;
    }

    if (!confirm("本当に削除しますか？")) return;

    try {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("delete failed");

      alert("削除しました");
      window.location.href = "index.html";
    } catch (err) {
      console.error("delete error:", err);
      alert("削除失敗");
    }
  });
}