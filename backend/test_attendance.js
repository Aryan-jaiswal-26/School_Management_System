const fetch = require('node-fetch');
(async () => {
  const base = 'http://localhost:5000/api/v1';
  const payload = [{
    session_date: new Date().toISOString().split('T')[0],
    grade: '10',
    section: 'A',
    student_id: '640e5e2e4c8e9c3b5c6a7b1f',
    student_name: 'Test Student',
    status: 'present',
    remarks: 'test'
  }];
  try {
    const res = await fetch(`${base}/attendance/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
})();
