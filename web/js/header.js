function renderGlobalHeader(pageTitle) {
  const header = document.createElement("header");
  header.className = "global-header";

  header.innerHTML = `
    <div id="globalMoonIcon" class="global-moon-icon floating-moon">🌙</div>

    <div class="header-top-layer">
      <div class="header-row">
        <div class="header-col left">
          <p id="globalLocation">📍 取得中...</p>
        </div>

        <div class="header-col center"></div>

        <div class="header-col right">
          <span id="globalWeatherIcon">🌤</span>
          <span id="globalTemp">--℃</span>
        </div>
      </div>
    </div>

    <div class="header-title-layer">
      <div class="header-row">
        <div class="header-col left">
          <p id="globalUser">ログイン中: -</p>
        </div>

        <div class="header-col center">
          <p id="globalMoonAge">月齢 --</p>
        </div>

        <div class="header-col right">
         <p id="globalWind">風 -- m/s</p>
        </div>
      </div>
    </div>
  `;

  document.body.prepend(header);

  loadGlobalHeaderData();
}


function windDirectionCodeToText(code) {
  const directions = {
    0: "静穏",
    1: "北北東",
    2: "北東",
    3: "東北東",
    4: "東",
    5: "東南東",
    6: "南東",
    7: "南南東",
    8: "南",
    9: "南南西",
    10: "南西",
    11: "西南西",
    12: "西",
    13: "西北西",
    14: "北西",
    15: "北北西",
    16: "北"
  };

  if (code == null) return "不明";
  return directions[code] || "不明";
}

async function getHeaderAmedasWind(amedasCode = "32402") {
  try {
    const timeRes = await fetch("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt");
    const timeText = await timeRes.text();

    const base = new Date(timeText.trim());

    for (let i = 0; i < 3; i++) {
      const dt = new Date(base.getTime() - i * 10 * 60 * 1000);

      const yyyy = dt.getFullYear();
      const MM = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      const ss = "00";

      const timeKey = `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
      const url = `https://www.jma.go.jp/bosai/amedas/data/map/${timeKey}.json`;

      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      const row = data[amedasCode];

      if (row) {
        return {
          windSpeed: row.wind?.[0] ?? null,
          windDirection: windDirectionCodeToText(row.windDirection?.[0])
        };
      }
    }

    return { windSpeed: null, windDirection: "不明" };
  } catch (e) {
    console.error("header amedas error:", e);
    return { windSpeed: null, windDirection: "不明" };
  }
}

function getMoonAgeSimple() {
  const now = new Date();
  const base = new Date(2000, 0, 6, 18, 14, 0);
  const diff = (now - base) / (1000 * 60 * 60 * 24);
  return (diff % 29.53).toFixed(1);
}

function getMoonEmojiByAge(age) {
  const moonAge = Number(age);

  if (isNaN(moonAge)) return "🌙";

  if (moonAge < 1.5) return "🌑";
  if (moonAge < 5.5) return "🌒";
  if (moonAge < 9.5) return "🌓";
  if (moonAge < 13.5) return "🌔";
  if (moonAge < 16.5) return "🌕";
  if (moonAge < 20.5) return "🌖";
  if (moonAge < 24.5) return "🌗";
  if (moonAge < 28.5) return "🌘";

  return "🌑";
}

function getWeatherIconSimple(text) {
  if (!text) return "🌤";
  if (text.includes("晴")) return "☀️";
  if (text.includes("曇") || text.includes("くもり")) return "☁️";
  if (text.includes("雨")) return "☔";
  if (text.includes("雪")) return "❄️";
  return "🌤";
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestPointForHeader(lat, lon, points) {
  let nearest = null;
  let minDist = Infinity;

  points.forEach((p) => {
    if (p.lat == null || p.lon == null) return;

    const dist = getDistance(lat, lon, Number(p.lat), Number(p.lon));

    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  });

  return nearest;
}

async function loadGlobalHeaderData() {
  const user = getLoginUser();

  const globalUser = document.getElementById("globalUser");
  const globalLocation = document.getElementById("globalLocation");
  const globalMoonIcon = document.getElementById("globalMoonIcon");
  const globalMoonAge = document.getElementById("globalMoonAge");

  if (user && globalUser) {
    globalUser.textContent = `ログイン中: ${user.name}`;
  }

  const moonAge = getMoonAgeSimple();

  if (globalMoonIcon) {
    globalMoonIcon.textContent = getMoonEmojiByAge(moonAge);
  }

  if (globalMoonAge) {
    globalMoonAge.textContent = `月齢 ${moonAge}`;
  }

  try {
    const res = await fetch(`${API_BASE}/points/`);
    const points = await res.json();

    if (!points.length) {
      globalLocation.textContent = "📍 ポイントなし";
      return;
    }

    if (!navigator.geolocation) {
      await applyHeaderWeather(points[0]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nearest = findNearestPointForHeader(
          pos.coords.latitude,
          pos.coords.longitude,
          points
        );

        await applyHeaderWeather(nearest || points[0]);
      },
      async () => {
        await applyHeaderWeather(points[0]);
      }
    );
  } catch (e) {
    console.error("header data error:", e);
    if (globalLocation) {
      globalLocation.textContent = "📍 取得失敗";
    }
  }
}

async function applyHeaderWeather(point) {
  const globalLocation = document.getElementById("globalLocation");
  const globalWeatherIcon = document.getElementById("globalWeatherIcon");
  const globalTemp = document.getElementById("globalTemp");
  const globalWind = document.getElementById("globalWind");

  if (!point) return;

  const forecastCode = String(point.forecast_code || "050000").padStart(6, "0");

  if (globalLocation) {
    globalLocation.textContent = `📍 ${point.name}`;
  }

  try {
    const forecastRes = await fetch(
      `https://www.jma.go.jp/bosai/forecast/data/forecast/${forecastCode}.json`
    );

    const forecastData = await forecastRes.json();

    const timeSeries = forecastData[0].timeSeries;
    const weatherArea = timeSeries[0].areas[0];
    const tempArea = timeSeries[2]?.areas?.[0];

    const weather = weatherArea?.weathers?.[0] || "情報なし";
    const temp = tempArea?.temps?.[0] || "--";

    if (globalWeatherIcon) {
      globalWeatherIcon.textContent = getWeatherIconSimple(weather);
    }

    if (globalTemp) {
      globalTemp.textContent = `${temp}℃`;
    }

    if (globalWind) {
      const amedasCode = String(point.amedas_code || "32402");
      const wind = await getHeaderAmedasWind(amedasCode);

      if (wind.windSpeed != null) {
        globalWind.textContent = `風 ${wind.windDirection} ${wind.windSpeed}m/s`;
      } else {
        globalWind.textContent = "風 情報なし";
      }
    }

  } catch (e) {
    console.error("header weather error:", e);

    if (globalWeatherIcon) globalWeatherIcon.textContent = "🌤";
    if (globalTemp) globalTemp.textContent = "--℃";
    if (globalWind) globalWind.textContent = "風 情報なし";
  }
}