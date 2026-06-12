import axios from 'axios';

async function runTest() {
  try {
    console.log('1. Attempting login to Super Admin API...');
    const loginRes = await axios.post('http://localhost:5001/api/v1/super-admin/login', {
      email: 'superadmin@campus.os',
      password: 'admin123'
    });
    
    const token = loginRes.data.data.token;
    console.log('Login successful! Token acquired.');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. Fetching schools...');
    const schoolsRes = await axios.get('http://localhost:5001/api/v1/super-admin/schools?page=1&limit=10', { headers });
    console.log('Schools Response Code:', schoolsRes.status);
    console.log('Total Schools found:', schoolsRes.data.data.total);
    console.log('Schools Data:', JSON.stringify(schoolsRes.data.data.data, null, 2));

    console.log('\n3. Fetching subscription plans...');
    const plansRes = await axios.get('http://localhost:5001/api/v1/super-admin/plans', { headers });
    console.log('Plans Response Code:', plansRes.status);
    console.log('Plans count:', plansRes.data.data.length);
    console.log('Plans Data:', JSON.stringify(plansRes.data.data, null, 2));

    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:');
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

runTest();
