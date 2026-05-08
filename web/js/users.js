const user = requireAdmin();

const userForm = document.getElementById("userForm");
const usersList = document.getElementById("usersList");

async function loadUsers() {
  usersList.innerHTML = `<p class="empty-message">読み込み中...</p>`;

  try {
    const res = await fetch(`${API_BASE}/admin/users`);
    const users = await res.json();

    if (!users.length) {
      usersList.innerHTML = `<p class="empty-message">ユーザーがいません。</p>`;
      return;
    }

    usersList.innerHTML = users
      .map((user) => {
        return `
          <div class="post-card" style="padding: 12px; margin-bottom: 12px;">
            <p><strong>${user.name}</strong></p>
            <p class="post-meta">学籍番号: ${user.student_id}</p>
            <button class="delete-user-btn" data-id="${user.id}">削除</button>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    usersList.innerHTML = `<p class="empty-message">読み込み失敗</p>`;
  }
}

if (userForm) {
  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentId = document.getElementById("studentId").value;
    const userName = document.getElementById("userName").value;

    const formData = new FormData();
    formData.append("student_id", studentId);
    formData.append("name", userName);

    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error();

      alert(data.message);
      userForm.reset();
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("ユーザー追加失敗");
    }
  });
}

loadUsers();

usersList.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-user-btn")) return;

  const userId = e.target.dataset.id;

  if (!confirm("このユーザーを削除しますか？")) return;

  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) throw new Error();

    alert(data.message);
    loadUsers();
  } catch (err) {
    console.error(err);
    alert("ユーザー削除失敗");
  }
});