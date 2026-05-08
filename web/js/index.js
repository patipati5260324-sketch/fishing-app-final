const postsContainer = document.getElementById("posts");
const searchInput = document.getElementById("searchInput");

const loginUser = getLoginUser();
const loginInfo = document.getElementById("loginInfo");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

const showAllBtn = document.getElementById("showAllBtn");
const showMineBtn = document.getElementById("showMineBtn");

if (loginUser && loginUser.is_admin && adminLink) {
  adminLink.style.display = "inline-block";
}

if (loginUser && loginInfo) {
  loginInfo.textContent = `ログイン中 : ${loginUser.name}`;
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loginUser");
    alert("ログアウトしました");
    window.location.href = "./login.html";
  });
}

let allPosts = [];

function formatDateTime(dtString) {
  if (!dtString) return "日時不明";

  const d = new Date(dtString);

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");

  return `${month}/${day} ${hour}:${minute}`;
}


function renderPosts(posts) {
  if (!postsContainer) return; 

  if (!posts.length) {
    postsContainer.innerHTML = `
      <p class="empty-message">該当する投稿がありません。</p>
    `;
    return;
  }

  postsContainer.innerHTML = posts
    .map((post) => {
      return `
        <a href="./detail.html?id=${post.id}" class="card-link">
          <article class="post-card">
            <img src="${post.image_url}" />
            <div class="post-content">
              <h2 class="post-title">${post.fish} ${post.size}cm</h2>
              <p class="post-meta">👤 ${post.user_name ?? "不明"}</p>
              <p class="post-meta">📍 ${post.place}</p>
              <p class="post-meta">🕒 ${formatDateTime(post.created_at)}</p>
              <p class="post-meta">❤️ ${post.likes ?? 0}</p>
            </div>
          </article>
        </a>
      `;
    })
    .join("");
}



async function loadPosts() {
  if (!postsContainer) return;

  postsContainer.innerHTML = `<p class="empty-message">読み込み中...</p>`;

  try {
    const res = await fetch(`${API_BASE}/posts/`);
    const posts = await res.json();

    allPosts = posts;

    if (!allPosts.length) {
      postsContainer.innerHTML = `
        <p class="empty-message">まだ投稿がありません。</p>
      `;
      return;
    }

    renderPosts(allPosts);
  } catch (error) {
    console.error(error);
    postsContainer.innerHTML = `
      <p class="empty-message">投稿一覧の読み込みに失敗しました。</p>
    `;
  }
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();

    const filtered = allPosts.filter((post) => {
      return (
        post.fish.toLowerCase().includes(keyword) ||
        post.place.toLowerCase().includes(keyword)
      );
    });

    renderPosts(filtered);
  });
}

function showMyPosts() {
  if (!loginUser) {
    alert("ログインしてください");
    return;
  }

  const mine = allPosts.filter(
    (post) =>
      post.user_name &&
      loginUser &&
      post.user_name.trim() === loginUser.name.trim()
  );
  renderPosts(mine);
}

function showAllPosts() {
  renderPosts(allPosts);
}

if (postsContainer) {
  loadPosts();
}

if (showMineBtn) {
  showMineBtn.addEventListener("click", showMyPosts);
}

if (showAllBtn) {
  showAllBtn.addEventListener("click", showAllPosts);
}