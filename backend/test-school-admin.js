async function signup() {
  const res = await fetch("http://127.0.0.1:5000/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "newschool@test.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "SCHOOL_ADMIN",
      schoolName: "My New School",
      schoolCode: "SCH-2026-1234"
    })
  });
  const data = await res.json();
  console.log(res.status, data);
}
signup();
