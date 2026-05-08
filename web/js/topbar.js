function renderTopbar(title) {
  const header = document.createElement("header");
  header.className = "topbar";

  header.innerHTML = `
    <div class="topbar-main">
      <h1>${title}</h1>

      <div class="auth-area">
        <span id="loginStatus">ログイン中: 読み込み中...</span>
        <button id="logoutBtn">ログアウト</button>
      </div>function renderHeader() {
  const headerHTML = `
    <header class="app-header">
      <div class="header-left">
        <div id="headerLocation" class="header-location">取得中...</div>
        <div id="headerUser" class="header-user">--</div>
      </div>

      <div class="header-center">
        <div class="moon-glow">🌙</div>
        <div id="headerMoonAge" class="moon-age"></div>
      </div>

      <div class="header-right">
        <div class="weather-icon" id="headerWeatherIcon">--</div>
        <div class="weather-temp" id="headerTemp">--℃</div>
        <div class="weather-wind" id="headerWind">風 --m/s</div>
      </div>
    </header>
  `;

  document.body.insertAdjacentHTML("afterbegin", headerHTML);
}
    </div>
  `;

  document.body.prepend(header);

  // ログイン表示
  const user = getLoginUser();
  const loginStatus = document.getElementById("loginStatus");

  if (user && loginStatus) {
    loginStatus.textContent = `ログイン中: ${user.name}`;
  }

  // ログアウト
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loginUser");
      alert("ログアウトしました");
      window.location.href = "./login.html";
    });
  }
}