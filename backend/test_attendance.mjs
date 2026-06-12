import fetch from 'node-fetch';

const base = 'http://localhost:5000/api/v1';

async function main() {
  try {
    // Login as a teacher (adjust credentials as needed)
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      return;
    }
    const token = loginData.data?.accessToken;
    console.log('Obtained token');

    // Prepare attendance payload
    const payload = [{
      session_date: '2023-09-01',
      grade: '10',
      section: 'A',
      student_id: '640e5e2e4c8e9c3b5c6a7b1f',
      student_name: 'Test Student',
      status: 'present',
      remarks: 'Test attendance'
    }];

    // Call bulk attendance endpoint
    const bulkRes = await fetch(`${base}/attendance/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const bulkData = await bulkRes.json();
    console.log('Bulk response:', bulkData);
  } catch (err) {
    console.error('Error:', err);
  }
}

await main();
