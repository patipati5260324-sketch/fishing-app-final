let lat = null;
let lon = null;
let locationMode = null;



const loginUser = requireLogin();
const locationText = document.getElementById("locationText");
const postMessage = document.getElementById("postMessage");
const pointSelect = document.getElementById("pointSelect");
let allPoints = [];

function windDirectionCodeToText(code) {
  const directions = {
    0: "静穏", 1: "北北東", 2: "北東", 3: "東北東",
    4: "東", 5: "東南東", 6: "南東", 7: "南南東",
    8: "南", 9: "南南西", 10: "南西", 11: "西南西",
    12: "西", 13: "西北西", 14: "北西", 15: "北北西", 16: "北"
  };
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

async function getPointWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m` +
    `&wind_speed_unit=ms` +
    `&timezone=Asia%2FTokyo`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Open-Meteo取得失敗");
  }

  return await res.json();
}

async function getAmedasWind(amedasCode = "32402") {
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
          windSpeed: row.wind && row.wind[0] != null ? row.wind[0] : null,
          windDirection:
            row.windDirection && row.windDirection[0] != null
              ? windDirectionCodeToText(row.windDirection[0])
              : null
        };
      }
    }

    return { windSpeed: null, windDirection: null };
  } catch (e) {
    console.error("amedas wind error:", e);
    return { windSpeed: null, windDirection: null };
  }
}

async function getTide() {
  try {
    const res = await fetch(`${API_BASE}/weather/tide`);
    if (!res.ok) throw new Error(`tide status: ${res.status}`);

    const data = await res.json();
    console.log("post tide:", data);
    return data;
  } catch (e) {
    console.error("tide error:", e);
    return null;
  }
}

function pickWeatherTextByTime(text) {
  if (!text) return "情報なし";

  const hour = new Date().getHours();

  if (text.includes("夜")) {
    const parts = text.split("夜").map((s) => s.trim()).filter(Boolean);

    if (hour < 18) {
      return parts[0] || text;
    }

    return parts[1] || parts[0] || text;
  }

  return text;
}

async function loadPoints() {
  try {
    const res = await fetch(`${API_BASE}/points/`);
    const points = await res.json();

    allPoints = points;

    if (!pointSelect) return;

    pointSelect.innerHTML = `
      <option value="">ポイントを選択</option>
    `;

    points.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      pointSelect.appendChild(option);
    });

  } catch (err) {
    console.error("points load error:", err);
  }
}

if (pointSelect) {
  pointSelect.addEventListener("change", () => {
    const selectedId = pointSelect.value;

    const latInput = document.getElementById("lat");
    const lonInput = document.getElementById("lon");
    const placeInput = document.getElementById("place");

    if (!selectedId) {
      locationMode = null;
      lat = null;
      lon = null;

      if (latInput) latInput.value = "";
      if (lonInput) lonInput.value = "";

      if (locationText) {
        locationText.textContent = "位置情報: 未取得";
      }
      return;
    }

    const point = allPoints.find((p) => p.id == selectedId);

    if (!point) return;

    if (placeInput) placeInput.value = point.name;
    if (latInput) latInput.value = point.lat;
    if (lonInput) lonInput.value = point.lon;

    lat = point.lat;
    lon = point.lon;
    locationMode = "point";

    if (locationText) {
      locationText.textContent = `選択中: ポイント「${point.name}」`;
    }
  });
}

// 📍位置取得
document.getElementById("getLocation").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("位置情報が使えません");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      locationMode = "gps";

      const latInput = document.getElementById("lat");
      const lonInput = document.getElementById("lon");

      if (latInput && lonInput) {
        latInput.value = lat;
        lonInput.value = lon;
      }

      if (pointSelect) {
        pointSelect.value = "";
      }

      if (locationText) {
        locationText.textContent = `選択中: 現在地 (${lat}, ${lon})`;
      }
    },
    () => {
      alert("位置取得に失敗");
    }
  );
});


// 📤投稿
document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const fishingDateTime = document.getElementById("fishingDateTime").value;
  const checkedCatchResult = document.querySelector('input[name="catchResult"]:checked');
  const catchResult = checkedCatchResult ? checkedCatchResult.value : "caught";
  const isNoCatch = catchResult === "no_catch";

  const fish = isNoCatch
    ? "釣果なし"
    : document.getElementById("fish").value.trim();

  const size = isNoCatch
    ? 0
    : document.getElementById("size").value;

  const place = document.getElementById("place").value;
  const imageFile = document.getElementById("image").files[0];

  const latInput = document.getElementById("lat");
  const lonInput = document.getElementById("lon");

  const latValue = latInput ? latInput.value : null;
  const lonValue = lonInput ? lonInput.value : null;

  let tideText = null;
  let moonAge = null;

  try {
    const tide = await getTide();

    if (tide?.tide?.chart) {
      const chartDateKey = Object.keys(tide.tide.chart)[0];
      const dayData = tide.tide.chart[chartDateKey];

      if (dayData?.moon?.title) {
        tideText = dayData.moon.title;
      }

      if (dayData?.moon?.age) {
        moonAge = dayData.moon.age;
      }
    }

  } catch (e) {
    console.error("潮取得失敗:", e);
  }


  if (!locationMode || !latValue || !lonValue) {
    if (postMessage) {
      postMessage.textContent = "ポイント選択または現在地取得をしてください";
      postMessage.className = "error";
    }
    return;
  }

  let weather = null;
  let temperature = null;
  let windSpeed = null;
  let windDirection = null;

  try {
    const point = allPoints.find((p) => p.name === place);
    const forecastCode = String(point?.forecast_code || "050000").padStart(6, "0");

    // 天気：気象庁
    const forecastRes = await fetch(
      `https://www.jma.go.jp/bosai/forecast/data/forecast/${forecastCode}.json`
    );
    const forecastData = await forecastRes.json();

    const timeSeries = forecastData[0].timeSeries;
    const weatherArea = timeSeries[0].areas[0];

    weather = pickWeatherTextByTime(weatherArea?.weathers?.[0] || null);

    // 気温・風：Open-Meteo
    const pointWeather = await getPointWeather(latValue, lonValue);
    const current = pointWeather.current;

    temperature = current?.temperature_2m ?? null;
    windSpeed = current?.wind_speed_10m ?? null;

    const windDeg = current?.wind_direction_10m ?? null;
    windDirection = windDeg != null ? degreeToDirection(windDeg) : null;

  } catch (e) {
    console.error("天気取得失敗（投稿は続行）:", e);
  }

  const formData = new FormData();
  formData.append("fish", fish);
  formData.append("size", size);
  formData.append("catch_result", catchResult);
  formData.append("place", place);
  formData.append("lat", latValue);
  formData.append("lon", lonValue);
  formData.append("image", imageFile);
  formData.append("user_name", loginUser.name);
  formData.append("fishing_datetime", fishingDateTime);

  if (tideText !== null && tideText !== undefined) {
    formData.append("tide", tideText);
  }

  if (moonAge !== null && moonAge !== undefined) {
    formData.append("moon_age", moonAge);
  }

  if (weather !== null && weather !== undefined) {
    formData.append("weather", weather);
  }

  if (temperature !== null && temperature !== undefined) {
    formData.append("temperature", temperature);
  }

  if (windSpeed !== null && windSpeed !== undefined) {
    formData.append("wind_speed", windSpeed);
  }

  if (windDirection !== null && windDirection !== undefined) {
    formData.append("wind_direction", windDirection);
  }

  try {
    const res = await fetch(`${API_BASE}/posts/`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error();

    if (postMessage) {
      postMessage.textContent = "投稿が完了しました！";
      postMessage.className = "success";
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);

  } catch (err) {
    console.error(err);
    if (postMessage) {
      postMessage.textContent = "投稿に失敗しました";
      postMessage.className = "error";
    }
  }
});

let amedasTableCache = null;

function toDecimalLatLon(value) {
  return value[0] + value[1] / 60;
}

function calcDistanceKm(lat1, lon1, lat2, lon2) {
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

async function getNearestAmedas(lat, lon) {
  if (!amedasTableCache) {
    const res = await fetch("https://www.jma.go.jp/bosai/amedas/const/amedastable.json");
    amedasTableCache = await res.json();
  }

  let nearest = null;
  let minDistance = Infinity;

  Object.entries(amedasTableCache).forEach(([code, station]) => {
    if (!station.lat || !station.lon) return;

    const stationLat = toDecimalLatLon(station.lat);
    const stationLon = toDecimalLatLon(station.lon);

    const distance = calcDistanceKm(
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
        lat: stationLat,
        lon: stationLon,
        distanceKm: distance
      };
    }
  });

  return nearest;
}

loadPoints();