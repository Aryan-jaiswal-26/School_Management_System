import fetch from 'node-fetch';

async function main() {
  // 1. Login as taschool@gmail.com
  const loginRes = await fetch('http://localhost:5001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'taschool@gmail.com', password: '123' })
  });

  console.log('Login Status:', loginRes.status);
  const loginData = await loginRes.json() as any;
  console.log('Login Response:', loginData);

  if (!loginRes.ok) {
    console.error('Login failed');
    return;
  }

  // Get cookie or token
  const cookies = loginRes.headers.raw()['set-cookie'] || [];
  const token = loginData.meta?.accessToken || loginData.data?.token || loginData.token;
  console.log('Token extracted:', token ? 'Found' : 'Not Found');

  // 2. Request POST /api/v1/library/books
  const bookRes = await fetch('http://localhost:5001/api/v1/library/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cookie': cookies.join('; ')
    },
    body: JSON.stringify({
      title: 'Admin Test Book',
      author: 'Tester',
      isbn: 'TEST-ADMIN',
      category: 'Science',
      totalCopies: 5,
      shelf: 'S-01'
    })
  });

  console.log('Book Creation Status:', bookRes.status);
  const bookData = await bookRes.json();
  console.log('Book Creation Response:', bookData);
}

main().catch(console.error);
