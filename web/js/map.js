const mapStatus = document.getElementById("mapStatus");

const map = L.map("map").setView([39.7, 140.1], 9);
const markers = L.markerClusterGroup();

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

async function loadMapPosts() {
  if (mapStatus) {
    mapStatus.textContent = "地図データを読み込み中...";
  }

  try {
    const res = await fetch(`${API_BASE}/posts/map`);
    const posts = await res.json();

    console.log("posts:", posts);

    if (!posts.length) {
      if (mapStatus) {
        mapStatus.textContent = "地図に表示できる投稿がありません";
      }
      return;
    }

    if (mapStatus) {
      mapStatus.textContent = "";
    }

    const usedPositions = {};

    posts.forEach((post) => {
      if (post.lat == null || post.lon == null) return;

      let lat = Number(post.lat);
      let lon = Number(post.lon);

      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;

      if (!usedPositions[key]) {
        usedPositions[key] = 0;
      } else {
        usedPositions[key] += 1;

        const offset = usedPositions[key] * 0.00015;
        lat += offset;
        lon += offset;
      }

      const marker = L.marker([lat, lon]);

      marker.bindPopup(`
        <div style="width:200px;">
          <img 
            src="${post.image_url}" 
            style="width:100%; height:120px; object-fit:cover;"
          />
          <strong>${post.fish} ${post.size}cm</strong><br/>
          📍 ${post.place}<br/>
          <a href="./detail.html?id=${post.id}">詳細</a>
        </div>
      `);

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    const first = posts[0];
    if (first && first.lat != null && first.lon != null) {
      map.setView([Number(first.lat), Number(first.lon)], 10);
    }

  } catch (error) {
    console.error("map load error:", error);

    if (mapStatus) {
      mapStatus.textContent = "読み込み失敗";
    }
  }
}

loadMapPosts();