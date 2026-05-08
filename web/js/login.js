const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentId = document.getElementById("studentId").value;

  const formData = new FormData();
  formData.append("student_id", studentId);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      loginMessage.textContent = data.message;
      return;
    }

    localStorage.setItem("loginUser", JSON.stringify(data.user));

    alert(`ログイン成功: ${data.user.name}`);
    window.location.href = "./index.html";
  } catch (err) {
    console.error(err);
    loginMessage.textContent = "ログイン失敗";
  }
});