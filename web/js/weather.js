const weatherPointSelect = document.getElementById("weatherPointSelect");
const reloadWeatherBtn = document.getElementById("reloadWeatherBtn");
const areaName = document.getElementById("areaName");
const reportTime = document.getElementById("reportTime");
const weatherBox = document.getElementById("weatherBox");
const useCurrentLocationBtn = document.getElementById("useCurrentLocationBtn");
const locationStatus = document.getElementById("locationStatus");


let allPoints = [];
let currentPoint = null;

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMoonAge() {
  const now = new Date();
  const base = new Date(2000, 0, 6, 18, 14, 0);
  const diff = (now - base) / (1000 * 60 * 60 * 24);
  return (diff % 29.53).toFixed(1);
}

function findHighLowTides(tideArray) {
  if (!tideArray || tideArray.length < 3) {
    return { highs: [], lows: [] };
  }

  const highs = [];
  const lows = [];

  for (let i = 1; i < tideArray.length - 1; i++) {
    const prev = tideArray[i - 1].cm;
    const curr = tideArray[i].cm;
    const next = tideArray[i + 1].cm;

    // 満潮（山）
    if (curr > prev && curr > next) {
      highs.push(tideArray[i]);
    }

    // 干潮（谷）
    if (curr < prev && curr < next) {
      lows.push(tideArray[i]);
    }
  }

  return { highs, lows };
}

function findNearestPoint(lat, lon) {
  if (!allPoints || allPoints.length === 0) return null;

  let nearest = null;
  let minDist = Infinity;

  allPoints.forEach((p) => {
    if (p.lat == null || p.lon == null) return;

    const pointLat = Number(p.lat);
    const pointLon = Number(p.lon);

    const dist = getDistance(lat, lon, pointLat, pointLon);

    console.log("point:", p.name, "dist:", dist);

    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  });

  console.log("nearest:", nearest, "minDist:", minDist);

  return nearest;
}

async function getJmaTide() {
  try {
    const res = await fetch(`${API_BASE}/weather/jma_tide`);
    const data = await res.json();
    console.log("JMA tide:", data);
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}


if (useCurrentLocationBtn) {
  useCurrentLocationBtn.addEventListener("click", async () => {
    console.log("=== 現在地ボタン押した ===");
    console.log("allPoints before:", allPoints);

    if (!allPoints || allPoints.length === 0) {
      locationStatus.textContent = "ポイント読み込み中...";
      await loadPoints();
      console.log("allPoints after loadPoints:", allPoints);
    }

    if (!navigator.geolocation) {
      alert("位置情報が使えません");
      return;
    }

    locationStatus.textContent = "位置取得中...";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        console.log("current lat/lon:", lat, lon);

        locationStatus.textContent = `現在地: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        const nearest = findNearestPoint(lat, lon);
        console.log("nearest point:", nearest);

        if (!nearest) {
          alert("ポイントが取得できませんでした");
          return;
        }

        locationStatus.textContent = `現在地から一番近いポイント: ${nearest.name}`;

        weatherPointSelect.value = nearest.id;
        loadWeatherByPoint(nearest);
      },
      (err) => {
        console.error("geolocation error:", err);
        alert("位置取得に失敗しました");
      }
    );
  });
}

function getWeatherIcon(text) {
  if (!text) return "🌤";

  const t = text.replace(/[ 　]/g, "");

  if (t.includes("晴") || t.includes("はれ")) return "☀️";
  if (t.includes("曇") || t.includes("くもり")) return "☁️";
  if (t.includes("雨") || t.includes("あめ")) return "☔";
  if (t.includes("雪") || t.includes("ゆき")) return "❄️";

  return "🌤";
}

function pickWeatherTextByTime(text) {
  if (!text) return "情報なし";

  const hour = new Date().getHours();

  // 例: "くもり 夜 晴れ"
  if (text.includes("夜")) {
    const parts = text.split("夜").map((s) => s.trim()).filter(Boolean);

    // 昼〜夕方
    if (hour < 18) {
      return parts[0] || text;
    }

    // 夜
    return parts[1] || parts[0] || text;
  }

  // 例: "晴れ 時々 くもり" はそのまま表示
  return text;
}

function formatWeatherSimple(text) {
  if (!text) return "情報なし";

  const cleaned = text
    .replace(/[ 　]/g, "")
    .replace(/朝|昼前|昼過ぎ|昼|夕方|夜遅く|夜/g, "");

  const splitWords = ["のち", "から", "時々"];

  for (const word of splitWords) {
    if (cleaned.includes(word)) {
      const [before, after] = cleaned.split(word);
      return `${getWeatherIcon(before)} → ${getWeatherIcon(after)}`;
    }
  }

  return `${getWeatherIcon(cleaned)}`;
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

function degreeToDirection(deg) {
  if (deg == null) return "不明";

  const directions = [
    "北", "北北東", "北東", "東北東",
    "東", "東南東", "南東", "南南東",
    "南", "南南西", "南西", "西南西",
    "西", "西北西", "北西", "北北西"
  ];

  const index = Math.round(Number(deg) / 22.5) % 16;
  return directions[index];
}

async function getLatestAmedasTime() {
  const res = await fetch("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt");
  const text = await res.text();

  // 例: 2026-04-22T10:00:00+09:00 → 20260422100000
  const dt = new Date(text.trim());
  const yyyy = dt.getFullYear();
  const MM = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");

  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
}

let amedasTableCache = null;

function toDecimalLatLon(value) {
  return value[0] + value[1] / 60;
}

async function getNearestAmedas(lat, lon) {
  if (!amedasTableCache) {
    const res = await fetch("https://www.jma.go.jp/bosai/amedas/const/amedastable.json");
    amedasTableCache = await res.json();
  }

  let nearest = null;
  let minDistance = Infinity;

  Object.entries(amedasTableCache).forEach(([code, station]) => {
    if (!station.lat || !station.lon) return;

    // 気温・風の観測がない地点は除外
    if (!station.elems) return;

    const hasTemp = station.elems.includes("temp");
    const hasWind = station.elems.includes("wind");

    if (!hasTemp || !hasWind) return;

    const stationLat = toDecimalLatLon(station.lat);
    const stationLon = toDecimalLatLon(station.lon);

    const distance = getDistance(
      Number(lat),
      Number(lon),
      stationLat,
      stationLon
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        code,
        name: station.kjName,
        distanceKm: distance
      };
    }
  });

  return nearest;
}


async function getAmedasWind(amedasCode = "32402") {
  try {
    const timeRes = await fetch("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt");
    const timeText = await timeRes.text();

    const base = new Date(timeText.trim());

    // 3回トライ（現在・10分前・20分前）
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

      console.log("try:", url);

      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      const row = data[amedasCode];

      if (row) {
        console.log("FOUND:", row);
        console.log("temp:", row.temp);
        console.log("wind:", row.wind);
        console.log("windDirection:", row.windDirection);

        return {
          temperature: row.temp && row.temp[0] != null ? row.temp[0] : null,
          windSpeed: row.wind && row.wind[0] != null ? row.wind[0] : null,
          windDirection:
            row.windDirection && row.windDirection[0] != null
              ? windDirectionCodeToText(row.windDirection[0])
              : "不明"
        };
      }
    }

    return {
      temperature: null,
      windSpeed: null,
      windDirection: "不明"
    };

  } catch (e) {
    console.error("amedas error:", e);
    return {
      temperature: null,
      windSpeed: null,
      windDirection: "不明"
    };
  }
}

// -----------------------------
// 1. ポイント一覧を読み込む
// -----------------------------
async function loadPoints() {

  

  try {
    const res = await fetch(`${API_BASE}/points/`);
    const points = await res.json();

    allPoints = points;
    
    weatherPointSelect.innerHTML = `
      <option value="">ポイントを選択</option>
    `;

    points.forEach((point) => {
      const option = document.createElement("option");
      option.value = point.id;
      option.textContent = point.name;
      weatherPointSelect.appendChild(option);
    });
    
    if (points.length > 0) {
      weatherPointSelect.value = points[0].id;
      loadWeatherByPoint(points[0]);
    }

  } catch (err) {
    console.error("points load error:", err);
    areaName.textContent = "ポイント一覧の取得に失敗しました";
  }
}

// -----------------------------
// 2. 天気カードを表示
// -----------------------------
function renderWeatherCards({ weather, temp, wind, wave }) {
  weatherBox.innerHTML = `
    <div class="post-card">
      <div class="post-content">
        <h3> 天気</h3>
        <p>${getWeatherIcon(pickWeatherTextByTime(weather))} ${pickWeatherTextByTime(weather)}</p>
      </div>
    </div>

    <div class="post-card">
      <div class="post-content">
        <h3>🌡 気温</h3>
        <p>${temp ? `${temp}℃` : "情報なし"}</p>
      </div>
    </div>

    <div class="post-card">
      <div class="post-content">
        <h3>💨 風</h3>
        <p>${wind || "情報なし"}</p>
      </div>
    </div>

    <div class="post-card">
      <div class="post-content">
        <h3>🌊 波</h3>
        <p>${wave || "情報なし"}</p>
      </div>
    </div>
  `;
}

// -----------------------------
// 3. 釣りアドバイスを作る
// -----------------------------

function evaluateFishingCondition({ weatherText, windSpeed, waveText, tideText, moonAge }) {
  let score = 0;
  const reasons = [];

  // 潮
  if (tideText === "大潮") {
    score += 3;
    reasons.push("大潮");
  } else if (tideText === "中潮") {
    score += 2;
    reasons.push("中潮");
  } else if (tideText === "小潮") {
    score += 1;
    reasons.push("小潮");
  }

  // 月齢（新月・満月付近を少し加点）
  const moon = Number(moonAge);
  if (!isNaN(moon)) {
    if (moon <= 2 || moon >= 27) {
      score += 2;
      reasons.push("月齢が有利");
    } else if (moon >= 13 && moon <= 16) {
      score += 2;
      reasons.push("満月付近");
    }
  }

  // 風
  const wind = Number(windSpeed);
  if (!isNaN(wind)) {
    if (wind <= 3) {
      score += 3;
      reasons.push("風が弱い");
    } else if (wind <= 5) {
      score += 2;
      reasons.push("風が比較的穏やか");
    } else if (wind <= 7) {
      score += 0;
    } else if (wind <= 9) {
      score -= 2;
      reasons.push("風が強め");
    } else {
      score -= 4;
      reasons.push("強風");
    }
  }

  // 波
  if (waveText) {
    if (waveText.includes("0.5メートル") || waveText.includes("1メートル")) {
      score += 2;
      reasons.push("波が低め");
    } else if (waveText.includes("2メートル")) {
      score -= 2;
      reasons.push("波が高め");
    } else if (waveText.includes("3メートル")) {
      score -= 4;
      reasons.push("波がかなり高い");
    }
  }

  // 天気
  if (weatherText) {
    if (weatherText.includes("雨")) {
      score -= 1;
      reasons.push("雨");
    }
    if (weatherText.includes("暴風") || weatherText.includes("雷")) {
      score -= 4;
      reasons.push("荒天");
    }
  }

  let label = "普通";
  let comment = "悪くはない条件です。";

  if (score >= 7) {
    label = "10";
    comment = "かなり狙いやすい条件です。";
  } else if (score >= 4) {
    label = "7";
    comment = "条件は比較的良いです。";
  } else if (score >= 1) {
    label = "4";
    comment = "タイミング次第です。";
  } else {
    label = "2";
    comment = "無理せず安全優先で判断してください。";
  }

  return {
    score,
    label,
    comment,
    reasons
  };
}

function getStarRating(score) {
  if (score >= 7) {
    return { text: "★★★★★", class: "star-best" };
  }
  if (score >= 4) {
    return { text: "★★★★☆", class: "star-good" };
  }
  if (score >= 1) {
    return { text: "★★★☆☆", class: "star-normal" };
  }
  return { text: "★★☆☆☆", class: "star-bad" };
}

function buildAdvice(weather, wind, wave) {
  let advice = "比較的釣りしやすそうです。";

  if (weather && weather.includes("雨")) {
    advice = "雨予報です。足元に注意してください。";
  }

  if (wind && (wind.includes("強") || wind.includes("やや強く"))) {
    advice = "風が強めです。軽い仕掛けは流されやすいかもしれません。";
  }

  if (wave && (wave.includes("2メートル") || wave.includes("2m") || wave.includes("高い"))) {
    advice = "波が高めです。海辺では安全第一で判断してください。";
  }

  return advice;
}

// -----------------------------
// 4. 気象庁データを取得して表示
// -----------------------------
async function loadWeatherByPoint(point) {
  if (!point) return;
  
  const areaName = document.getElementById("areaName");
  const reportTime = document.getElementById("reportTime");
  const weatherBox = document.getElementById("weatherBox");

  if (!point || !areaName || !reportTime || !weatherBox) {
    console.error("釣り環境の表示要素が見つかりません", {
      point,
      areaName,
      reportTime,
      weatherBox
    });
    return;
  }

  currentPoint = point;

  areaName.textContent = `${point.name} の釣り環境`;
  reportTime.textContent = "読み込み中...";
  weatherBox.innerHTML = `<p class="empty-message">天気情報を取得中...</p>`;

  try {
    const forecastCode = String(point.forecast_code || "050000").padStart(6, "0");
    
    console.log("selected point:", point);
    console.log("forecastCode:", forecastCode);
 
    const pointWeather = await getPointWeather(point.lat, point.lon);

    const pointTemp = pointWeather.current?.temperature_2m ?? null;
    const pointWindSpeed = pointWeather.current?.wind_speed_10m ?? null;
    const pointWindDirection = pointWeather.current?.wind_direction_10m ?? null;
    const pointRain = pointWeather.current?.precipitation ?? null;
    
    // 予報
    const forecastRes = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${forecastCode}.json`);
    const forecastData = await forecastRes.json();

    const jma = await getJmaTide();

    const tide = await getTide();


    let tideText = "情報なし";
    let moonAge = "情報なし";
    let jmaHigh = "情報なし";
    let jmaLow = "情報なし";

    if (tide?.tide?.chart) {
      const chartDateKey = Object.keys(tide.tide.chart)[0];
      const dayData = tide.tide.chart[chartDateKey];

      // 潮名
      if (dayData?.moon?.title) {
        tideText = dayData.moon.title;
      }

      // 月齢
      if (dayData?.moon?.age) {
        moonAge = dayData.moon.age;
      }
    }

    if (jma) {
      if (jma.high && jma.high.length > 0) {
        jmaHigh = jma.high.join(" / ");
      }

      if (jma.low && jma.low.length > 0) {
        jmaLow = jma.low.join(" / ");
      }
    }

    //const moonAge = getMoonAge();

    // 実況風（最初は固定コード）
    const nearestAmedas = await getNearestAmedas(point.lat, point.lon);
    const amedasCode = nearestAmedas?.code || String(point.amedas_code || "32402");

    console.log("nearestAmedas:", nearestAmedas);
    console.log("amedasCode:", amedasCode);

    const amedas = await getAmedasWind(amedasCode);

    const timeSeries = forecastData[0].timeSeries;
    const weatherArea = timeSeries[0].areas[0];
    const tempArea = timeSeries[2]?.areas?.[0];

    const weather = weatherArea?.weathers?.[0] || "情報なし";
    const wave = weatherArea?.waves?.[0] || "情報なし";
    const temp = tempArea?.temps?.[0] || null;

    const report = forecastData[0].reportDatetime || "";
    reportTime.textContent = `発表時刻: ${report}`;

    const weatherRaw = weather;              // 元データ
    const weatherDisplay = formatWeatherSimple(weatherRaw); // 表示用

    const fishingResult = evaluateFishingCondition({
      weatherText: weatherRaw,
      windSpeed: amedas.windSpeed,
      waveText: wave,
      tideText: tideText,
      moonAge: moonAge
    });
    
    const star = getStarRating(fishingResult.score);


    let advice = "比較的釣りしやすそうです。";

    if (weatherRaw.includes("雨")) {
      advice = "雨の可能性があります。足元に注意してください。";
    }

    if (amedas.windSpeed !== "不明" && Number(amedas.windSpeed) >= 8) {
      advice = "風がかなり強いです。安全第一で判断してください。";
    }

    if (wave && (wave.includes("2メートル") || wave.includes("2m") || wave.includes("高い"))) {
      advice = "波が高めです。海辺では安全を優先してください。";
    }

    weatherBox.innerHTML = `
      <!-- 基本情報 -->
      <div class="post-card">
        <div class="post-content">
          <h3>🌤 基本情報</h3>
          <p>天気: ${weatherDisplay}</p>
          <p>気温: ${pointTemp != null ? `${pointTemp}℃` : "情報なし"}</p>
          <p>風速: ${pointWindSpeed != null ? `${pointWindSpeed} m/s` : "情報なし"}</p>
          <p>風向: ${
            pointWindDirection != null
              ? `${degreeToDirection(pointWindDirection)}`
              : "情報なし"
          }</p>
          <p>降水量: ${pointRain != null ? `${pointRain} mm` : "情報なし"}</p>
          <p>波: ${wave}</p>
          <p>潮: ${tideText}</p>
          <p>月齢: ${moonAge}</p>
        </div>
      </div>

      <!-- 潮 -->
      <div class="post-card">
        <div class="post-content">
          <h3>🌊 潮汐</h3>
          <p>満潮: ${jmaHigh}</p>
          <p>干潮: ${jmaLow}</p>
        </div>
      </div>

      <!-- 釣り評価 -->
      <div class="post-card">
        <div class="post-content">
          <h3>🎣 釣れやすさ</h3>
          <p class="fishing-star ${star.class}">${star.text}</p>
          <p>スコア: ${fishingResult.score}</p>
          <p>${fishingResult.comment}</p>
        </div>
      </div>

      <div class="post-card">
        <div class="post-content">
          <h3>🎣 アドバイス</h3>
          <p>${advice}</p>
        </div>
      </div>
    `;

  } catch (err) {
    console.error("weather load error:", err);
    weatherBox.innerHTML = `<p class="empty-message">天気情報の取得に失敗しました。</p>`;
    reportTime.textContent = "";
    
  }
}

// -----潮読み取り

async function getTide() {
  try {
    const res = await fetch(`${API_BASE}/weather/tide`);
    if (!res.ok) throw new Error(`tide status: ${res.status}`);

    const data = await res.json();
    console.log("tide:", data);

    return data;
  } catch (e) {
    console.error("tide error:", e);
    return null;
  }
}

async function getTideInfo() {
  try {
    return {
      name: "取得準備中"
    };
  } catch (e) {
    console.error("tide error:", e);
    return {
      name: "情報なし"
    };
  }
}

// -----------------------------
// 5. ポイント選択イベント
// -----------------------------
if (weatherPointSelect) {
  weatherPointSelect.addEventListener("change", () => {
    const selectedId = weatherPointSelect.value;

    if (!selectedId) {
      currentPoint = null;
      areaName.textContent = "ポイントを選択してください";
      reportTime.textContent = "";
      weatherBox.innerHTML = "";
      return;
    }

    const point = allPoints.find((p) => p.id == selectedId);

    if (!point) return;

    loadWeatherByPoint(point);
  });
}
// -----------------------------
// 6. 更新ボタン
// -----------------------------
if (reloadWeatherBtn) {
  reloadWeatherBtn.addEventListener("click", () => {
    if (!currentPoint) {
      alert("先にポイントを選択してください");
      return;
    }

    loadWeatherByPoint(currentPoint);
  });
}


// -----------------------------
// 7. 初期読み込み
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
  console.log("weatherPointSelect:", weatherPointSelect);
  console.log("weatherBox:", weatherBox);

  loadPoints();
});


async function getPointWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability` +
    `&wind_speed_unit=ms` +
    `&timezone=Asia%2FTokyo`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Open-Meteo取得失敗");
  }

  return await res.json();
}