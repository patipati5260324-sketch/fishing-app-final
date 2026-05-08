const API_BASE = "https://fishing-app-final.onrender.com";

let userId = localStorage.getItem("userId");

if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("userId", userId);
}

function getLoginUser() {
  const user = localStorage.getItem("loginUser");
  return user ? JSON.parse(user) : null;
}

function requireLogin() {
  const user = getLoginUser();
  if (!user) {
    alert("ログインしてください");
    window.location.href = "./login.html";
  }
  return user;
}

function requireAdmin() {
  const user = getLoginUser();

  if (!user) {
    alert("ログインしてください");
    window.location.href = "./login.html";
    return null;
  }

  if (!user.is_admin) {
    alert("管理者のみアクセスできます");
    window.location.href = "./index.html";
    return null;
  }

  return user;
}