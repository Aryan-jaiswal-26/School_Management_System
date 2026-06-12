async function signup() {
  const res = await fetch("http://127.0.0.1:5000/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "User",
      email: "testuserfail@school.com",
      password: "password123",
      role: "STUDENT"
    })
  });
  const data = await res.json();
  console.log(res.status, data);
}
signup();
