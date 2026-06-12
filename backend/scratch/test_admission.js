const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/v1/students/admission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'hshe',
        lastName: 'j',
        email: 'student852@gmail.com',
        password: 'Test123!',
        schoolCode: 'SCH-2026-6821',
        fullName: 'hshe j',
        admissionNumber: '25',
        rollNumber: '25',
        gender: 'MALE',
        address: 'wqdw',
        emergencyContact: '1235467898',
        dob: '2026-06-23T00:00:00.000Z'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error('Error:', err);
  }
})();
