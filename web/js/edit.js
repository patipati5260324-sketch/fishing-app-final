const loginUser = requireLogin();

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const fishInput = document.getElementById("fish");
const sizeInput = document.getElementById("size");
const placeInput = document.getElementById("place");
const editForm = document.getElementById("editForm");

if (!id) {
  alert("不正なアクセスです");
  window.location.href = "./index.html";
}

async function loadPost() {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`);
    const post = await res.json();

    // 自分の投稿じゃないなら編集不可
    if (post.user_name !== loginUser.name) {
      alert("自分の投稿しか編集できません");
      window.location.href = `./detail.html?id=${id}`;
      return;
    }

    fishInput.value = post.fish;
    sizeInput.value = post.size;
    placeInput.value = post.place;
  } catch (err) {
    console.error(err);
    alert("投稿の読み込みに失敗しました");
  }
}

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("fish", fishInput.value);
  formData.append("size", sizeInput.value);
  formData.append("place", placeInput.value);

  try {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error();

    alert(data.message);
    window.location.href = `./detail.html?id=${id}`;
  } catch (err) {
    console.error(err);
    alert("更新失敗");
  }
});

loadPost();