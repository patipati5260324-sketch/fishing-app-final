function renderBottomTab(active) {
  const tab = document.createElement("nav");
  tab.className = "bottom-tabbar";

  tab.innerHTML = `
    <a href="./home.html" class="${active === 'home' ? 'active' : ''}">
      🏠<span>ホーム</span>
    </a>
    <a href="./weather.html" class="${active === 'weather' ? 'active' : ''}">
      🌤<span>環境</span>
    </a>
    <a href="./analysis.html" class="${active === 'analysis' ? 'active' : ''}">
      📊<span>分析</span>
    </a>
    <a href="./admin.html" class="${active === 'admin' ? 'active' : ''}">
      ⚙️<span>管理</span>
    </a>
  `;

  document.body.appendChild(tab);
}