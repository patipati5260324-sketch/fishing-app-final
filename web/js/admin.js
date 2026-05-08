// ===============================
// 管理ページ用JS
// ===============================

// 管理者チェック
const user = requireLogin();
const userCardText = document.querySelector(".user-admin-note");

if (userCardText && !user.is_admin) {
  userCardText.textContent = "管理者のみ利用できます";
}

const usersAdminLink = document.getElementById("usersAdminLink");

if (usersAdminLink) {
  usersAdminLink.addEventListener("click", (e) => {
    if (!user || !user.is_admin) {
      e.preventDefault();
      alert("ユーザー管理は管理者のみ利用できます。");
    }
  });
}

// ログイン表示
const loginStatus = document.getElementById("loginStatus");
if (loginStatus && user) {
  loginStatus.textContent = `ログイン中: ${user.name}`;
}

// ログアウト処理
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    const ok = confirm("ログアウトしますか？");
    if (!ok) return;

    localStorage.removeItem("loginUser");
    alert("ログアウトしました");
    window.location.href = "./login.html";
  });
}