const analysisPointSelect = document.getElementById("analysisPointSelect");
const analysisResult = document.getElementById("analysisResult");

let allPoints = [];

function formatTop3(list) {
  if (!list || list.length === 0) return "データなし";

  return list
    .map((item, index) => {
      const [name, count] = item;

      if (index === 0) return `<span class="rank1">🥇 ${name} (${count}件)</span>`;
      if (index === 1) return `🥈 ${name} (${count}件)`;
      return `🥉 ${name} (${count}件)`;
    })
    .join("<br>");
}

function formatSuccessRateByTime(rates) {
  if (!rates) return "データなし";

  return ["朝", "昼", "夕方", "夜"]
    .map((zone) => {
      const rate = rates[zone];

      if (rate === null || rate === undefined) {
        return `${zone}: データなし`;
      }

      return `${zone}: ${rate}%`;
    })
    .join("<br>");
}

function buildSummary(data) {
  if (!data.top_fish || data.top_fish.length === 0) return "データ不足";

  const fish = data.top_fish[0][0];
  const time = data.top_time_zone[0][0];

  return `${time}に${fish}が狙いやすいポイント`;
}

async function loadPoints() {
  try {
    const res = await fetch(`${API_BASE}/points/`);
    const points = await res.json();

    allPoints = points;

    analysisPointSelect.innerHTML = `<option value="">ポイントを選択</option>`;

    points.forEach((point) => {
      const option = document.createElement("option");
      option.value = point.id;
      option.textContent = point.name;
      analysisPointSelect.appendChild(option);
    });

    if (points.length > 0) {
      analysisPointSelect.value = points[0].id;
      loadAnalysis(points[0].id);
    }
  } catch (err) {
    console.error("points load error:", err);
    analysisResult.innerHTML = `<p class="empty-message">ポイント一覧の取得に失敗しました</p>`;
  }
}

async function loadAnalysis(pointId) {
  if (!pointId) {
    analysisResult.innerHTML = `<p class="empty-message">ポイントを選択してください</p>`;
    return;
  }

  analysisResult.innerHTML = `<p class="empty-message">分析を読み込み中...</p>`;

  try {
    const res = await fetch(`${API_BASE}/points/${pointId}/analysis`);
    const data = await res.json();

    if (data.error) {
      analysisResult.innerHTML = `<p class="empty-message">分析データがありません</p>`;
      return;
    }

    analysisResult.innerHTML = `
      <div class="analysis-scroll">

        <div class="post-card">
          <div class="post-content">
            <h3>📌 基本情報</h3>
            <p class="post-meta">投稿数: ${data.post_count}</p>
            <p class="post-meta">釣れた: ${data.caught_count ?? 0}件</p>
            <p class="post-meta">釣れなかった: ${data.no_catch_count ?? 0}件</p>
            <p class="post-meta">釣果率: ${data.catch_rate ?? 0}%</p>
            <p class="post-meta">平均サイズ: ${data.avg_size ?? "データなし"} cm</p>
          </div>
        </div>

        <div class="post-card">
          <div class="post-content">
            <h3>🐟 魚</h3>
            <p class="post-meta">${formatTop3(data.top_fish)}</p>
          </div>
        </div>

        <div class="post-card">
          <div class="post-content">
            <h3>🔥 時間帯別成功率</h3>
            <p class="post-meta">
              ${formatSuccessRateByTime(data.success_rate_by_time)}
            </p>
          </div>
        </div>

        <div class="post-card">
          <div class="post-content">
            <h3>🌊 潮</h3>
            <p class="post-meta">${formatTop3(data.top_tide)}</p>
          </div>
        </div>

        <div class="post-card">
          <div class="post-content">
            <h3>🌤 天気</h3>
            <p class="post-meta">${formatTop3(data.top_weather)}</p>
          </div>
        </div>

      </div>
    `;

 
  } catch (err) {
    console.error("analysis load error:", err);
    analysisResult.innerHTML = `<p class="empty-message">分析の取得に失敗しました</p>`;
  }
}

analysisPointSelect.addEventListener("change", () => {
  loadAnalysis(analysisPointSelect.value);
});

loadPoints();