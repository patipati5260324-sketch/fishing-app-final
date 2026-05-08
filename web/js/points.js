const loginUser = requireLogin();

const pointForm = document.getElementById("pointForm");
const getLocationBtn = document.getElementById("getLocationBtn");
const latInput = document.getElementById("lat");
const lonInput = document.getElementById("lon");

const pointMap = L.map("pointMap").setView([39.7, 140.1], 9);

const mapElement = document.getElementById("pointMap");

if (!mapElement) {
  console.log("このページではpoints.jsを使いません");
} else {

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(pointMap);

let selectedMarker = null;

if (getLocationBtn) {
  getLocationBtn.addEventListener("click", () => {
    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "取得中...";

    if (!navigator.geolocation) {
      alert("位置情報が使えません");
      resetLocationBtn();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        latInput.value = lat;
        lonInput.value = lon;

        pointMap.setView([lat, lon], 13);

        if (selectedMarker) {
          pointMap.removeLayer(selectedMarker);
        }

        selectedMarker = L.marker([lat, lon]).addTo(pointMap);

        resetLocationBtn();
      },
      (err) => {
        console.error(err);
        alert("位置情報の取得に失敗しました");
        resetLocationBtn();
      }
    );
  });
}

window.deletePoint = async function(pointId) {
  const ok = confirm("このポイントを削除しますか？");
  if (!ok) return;

  try {
    const res = await fetch(`${API_BASE}/points/${pointId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("削除に失敗しました");
    }

    alert("ポイントを削除しました");
    location.reload();
  } catch (error) {
    console.error(error);
    alert("ポイントの削除に失敗しました");
  }
};

function resetLocationBtn() {
  if (!getLocationBtn) return;

  getLocationBtn.disabled = false;
  getLocationBtn.textContent = "現在地";
}

pointMap.on("click", (e) => {
  const { lat, lng } = e.latlng;

  latInput.value = lat;
  lonInput.value = lng;

  if (selectedMarker) {
    pointMap.removeLayer(selectedMarker);
  }

  selectedMarker = L.marker([lat, lng]).addTo(pointMap);
});

if (pointForm) {
  pointForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pointName = document.getElementById("pointName").value;
    const description = document.getElementById("description").value;
    const lat = document.getElementById("lat").value;
    const lon = document.getElementById("lon").value;
    const forecastCode = document.getElementById("forecastCode").value;
    const amedasCode = document.getElementById("amedasCode").value;

    const formData = new FormData();
    formData.append("name", pointName);
    formData.append("description", description);
    formData.append("lat", lat);
    formData.append("lon", lon);
    formData.append("created_by", loginUser.name);
    formData.append("forecast_code", forecastCode);
    formData.append("amedas_code", amedasCode);

    try {
      const res = await fetch(`${API_BASE}/points/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error();

      alert(data.message);
      pointForm.reset();
      window.location.href = "./map.html";
    } catch (err) {
      console.error(err);
      alert("ポイント追加失敗");
    }
  });
}

}