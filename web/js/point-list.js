requireLogin();

const pointSelect = document.getElementById("pointSelectForMap");
const deletePointBtn = document.getElementById("deleteSelectedPointBtn");
const mapElement = document.getElementById("pointListMap");

let allPoints = [];
let listMap = null;
let selectedMarker = null;
let selectedPointId = null;

if (mapElement) {
  listMap = L.map("pointListMap").setView([39.7, 140.1], 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(listMap);
}

async function loadPoints() {
  try {
    const res = await fetch(`${API_BASE}/points/`);
    const points = await res.json();

    allPoints = points;

    if (!points.length) {
      pointSelect.innerHTML = `<option value="">ポイントがありません</option>`;
      if (deletePointBtn) deletePointBtn.disabled = true;
      return;
    }

    pointSelect.innerHTML = `
      <option value="">ポイントを選択</option>
      ${points.map(point => `
        <option value="${point.id}">${point.name}</option>
      `).join("")}
    `;

    if (deletePointBtn) deletePointBtn.disabled = true;
  } catch (error) {
    console.error(error);
    alert("ポイント一覧の取得に失敗しました");
  }
}

pointSelect.addEventListener("change", () => {
  selectedPointId = Number(pointSelect.value);
  const point = allPoints.find(p => p.id === selectedPointId);

  if (!point) {
    if (deletePointBtn) deletePointBtn.disabled = true;
    return;
  }

  if (deletePointBtn) deletePointBtn.disabled = false;

  const lat = Number(point.lat);
  const lon = Number(point.lon);

  if (selectedMarker) {
    listMap.removeLayer(selectedMarker);
  }

  selectedMarker = L.marker([lat, lon])
    .addTo(listMap)
    .bindPopup(`📍 ${point.name}`)
    .openPopup();

  listMap.setView([lat, lon], 15);
});

if (deletePointBtn) {
  deletePointBtn.addEventListener("click", async () => {
    if (!selectedPointId) {
      alert("削除するポイントを選択してください");
      return;
    }

    const point = allPoints.find(p => p.id === selectedPointId);
    const ok = confirm(`「${point?.name ?? "このポイント"}」を削除しますか？`);

    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/points/${selectedPointId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("削除に失敗しました");
      }

      alert("ポイントを削除しました");

      if (selectedMarker) {
        listMap.removeLayer(selectedMarker);
        selectedMarker = null;
      }

      selectedPointId = null;
      await loadPoints();
    } catch (error) {
      console.error(error);
      alert("ポイントの削除に失敗しました");
    }
  });
}

loadPoints();