import fetch from 'node-fetch';

const base = 'http://localhost:5000/api/v1';

async function registerTeacher() {
  const payload = {
    fullName: 'Test Teacher',
    email: 'testteacher@example.com',
    password: 'Password123!',
    role: 'TEACHER'
  };
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  const data = await res.json();
  console.log('Register response:', data);
  return res.ok;
}

async function loginTeacher() {
  const payload = { email: 'testteacher@example.com', password: 'Password123!' };
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  const data = await res.json();
  console.log('Login response:', data);
  if (!res.ok) throw new Error('Login failed');
  return data.data?.accessToken || data.accessToken;
}

async function getFirstStudentId(token) {
  const res = await fetch(`${base}/students?limit=1`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) { console.error('Failed to fetch students', data); throw new Error('No students'); }
  const student = (data.data && data.data[0]) || null;
  if (!student) throw new Error('No student data');
  return student._id || student.id || student.student_id;
}

async function markAttendance(token, studentId) {
  const payload = [{
    session_date: new Date().toISOString().split('T')[0],
    grade: '10',
    section: 'A',
    student_id: studentId,
    student_name: 'Test Student',
    status: 'present',
    remarks: 'Test attendance from script'
  }];
  const res = await fetch(`${base}/attendance/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log('Bulk attendance response:', data);
}

(async () => {
  try {
    await registerTeacher();
    const token = await loginTeacher();
    const studentId = await getFirstStudentId(token);
    await markAttendance(token, studentId);
  } catch (e) {
    console.error('Error in script:', e);
  }
})();
