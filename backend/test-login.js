async function login() {
  const res = await fetch("http://127.0.0.1:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "testuserfail@school.com",
      password: "password123",
    })
  });
  const data = await res.json();
  console.log(res.status, data);
}
login();
