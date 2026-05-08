// =====================
// home.js
// =====================

const homeLocationName = document.getElementById("homeLocationName");
console.log(homeLocationName);
const homeUserName = document.getElementById("homeUserName");
const homeWeatherIcon = document.getElementById("homeWeatherIcon");
const homeTemp = document.getElementById("homeTemp");
const homeWind = document.getElementById("homeWind");
const homeMoonAge = document.getElementById("homeMoonAge");

const loginUser = getLoginUser();

if (loginUser && homeUserName) {
  homeUserName.textContent = `${loginUser.name}`;
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

function getWeatherIcon(text) {
  if (!text) return "🌤";

  if (text.includes("晴")) return "☀️";
  if (text.includes("曇") || text.includes("くもり")) return "☁️";
  if (text.includes("雨")) return "☔";
  if (text.includes("雪")) return "❄️";

  return "🌤";
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

  return directions[code] || "不明";
}

function getMoonAgeSimple() {
  const now = new Date();
  const base = new Date(2000, 0, 6, 18, 14, 0);
  const diff = (now - base) / (1000 * 60 * 60 * 24);
  return (diff % 29.53).toFixed(1);
}

function getMoonEmoji(age) {
  const moonAge = Number(age);

  if (moonAge < 1.5) return "🌑";       // 新月
  if (moonAge < 6.5) return "🌒";       // 三日月〜上弦前
  if (moonAge < 9.5) return "🌓";       // 上弦
  if (moonAge < 13.5) return "🌔";      // 満月前
  if (moonAge < 16.5) return "🌕";      // 満月
  if (moonAge < 21.5) return "🌖";      // 欠け始め
  if (moonAge < 24.5) return "🌗";      // 下弦
  if (moonAge < 28.5) return "🌘";      // 新月前

  return "🌑";
}

async function getAmedasWind(amedasCode = "32402") {
  try {
    const timeRes = await fetch("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt");
    const timeText = await timeRes.text();

    const dt = new Date(timeText.trim());

    const yyyy = dt.getFullYear();
    const MM = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    const latestTime = `${yyyy}${MM}${dd}${hh}${mm}00`;

    const res = await fetch(`https://www.jma.go.jp/bosai/amedas/data/map/${latestTime}.json`);
    const data = await res.json();

    const row = data[amedasCode];

    if (!row) {
      return {
        windSpeed: "不明",
        windDirection: "不明"
      };
    }

    return {
      windSpeed: row.wind?.[0] ?? "不明",
      windDirection: windDirectionCodeToText(row.windDirection?.[0])
    };
  } catch (e) {
    console.error("home amedas error:", e);
    return {
      windSpeed: "取得失敗",
      windDirection: "取得失敗"
    };
  }
}

function findNearestPoint(lat, lon, points) {
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

async function loadHomeWeather(point) {
  if (!point) return;

  const forecastCode = String(point.forecast_code || "050000").padStart(6, "0");
  const amedasCode = String(point.amedas_code || "32402");

  homeLocationName.textContent = `📍 ${point.name}`;

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

    const amedas = await getAmedasWind(amedasCode);

    homeWeatherIcon.textContent = getWeatherIcon(weather);
    homeTemp.textContent = `${temp}℃`;

    if (amedas.windSpeed === "不明" || amedas.windSpeed === "取得失敗") {
      homeWind.textContent = `${amedas.windDirection}`;
    } else {
      homeWind.textContent = `${amedas.windDirection} ${amedas.windSpeed}m/s`;
    }
  } catch (e) {
    console.error("home weather error:", e);
    homeWeatherIcon.textContent = "🌤";
    homeTemp.textContent = "--℃";
    homeWind.textContent = "情報なし";
  }
}

async function initHome() {
  const moonAge = getMoonAgeSimple();
  const moonEmoji = getMoonEmoji(moonAge);

  if (homeMoonAge) {
    homeMoonAge.textContent = `月齢 ${moonAge}`;
  }

  const moonGlow = document.querySelector(".moon-glow");

  if (moonGlow) {
    moonGlow.textContent = moonEmoji;
  }

  try {
    const res = await fetch(`${API_BASE}/points/`);
    const points = await res.json();

    if (!points.length) {
      if (homeLocationName) {
        homeLocationName.textContent = "📍 ポイントなし";
      }
      return;
    }

    if (!navigator.geolocation) {
      await loadHomeWeather(points[0]);
      return;
    }

    if (homeLocationName) {
      homeLocationName.textContent = "📍 現在地取得中...";
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const nearest = findNearestPoint(lat, lon, points);

        if (!nearest) {
          await loadHomeWeather(points[0]);
          return;
        }

        await loadHomeWeather(nearest);
      },
      async (err) => {
        console.error("home geolocation error:", err);
        await loadHomeWeather(points[0]);
      }
    );
  } catch (e) {
    console.error("home init error:", e);
    if (homeLocationName) {
      homeLocationName.textContent = "📍 取得失敗";
    }
  }
}

initHome();