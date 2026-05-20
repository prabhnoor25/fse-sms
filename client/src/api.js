const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function handleRes(res) {
  const contentType = res.headers && res.headers.get ? res.headers.get('content-type') || '' : '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (e) {
      return { error: 'Invalid JSON response' };
    }
  }
  // fallback: return text body or status
  try {
    const text = await res.text();
    return { error: text || res.statusText || 'Invalid response' };
  } catch (e) {
    return { error: 'Invalid response' };
  }
}

function authHeader(token) {
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ username, password })
  });
  return handleRes(res);
}

export async function signup(data) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(data)
  });
  return handleRes(res);
}

export async function getDashboard(token) {
  const res = await fetch(`${API_URL}/dashboard/admin`, {
    headers: authHeader(token)
  });
  return handleRes(res);
}

// Helper: counts for dashboard
export async function getCounts(token) {
  const endpoints = [
    'students', 'teachers', 'classes', 'subjects', 'assignments', 'enrollments'
  ];
  const fetches = endpoints.map(e => fetch(`${API_URL}/${e}`, { headers: authHeader(token) }).then(r => r.json()));
  const results = await Promise.all(fetches);
  return {
    students: results[0].students ? results[0].students.length : 0,
    teachers: results[1].teachers ? results[1].teachers.length : 0,
    classes: results[2].classes ? results[2].classes.length : 0,
    subjects: results[3].subjects ? results[3].subjects.length : 0,
    assignments: results[4].assignments ? results[4].assignments.length : 0,
    enrollments: results[5].enrollments ? results[5].enrollments.length : 0,
  };
}

// Students
export async function getStudents(token) {
  const res = await fetch(`${API_URL}/students`, { headers: authHeader(token) });
  return handleRes(res);
}
export async function createStudent(token, data) {
  const res = await fetch(`${API_URL}/students`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) });
  return handleRes(res);
}
export async function updateStudent(token, id, data) { const res = await fetch(`${API_URL}/students/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function deleteStudent(token, id) {
  const res = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE', headers: authHeader(token) });
  return handleRes(res);
}

// Teachers
export async function getTeachers(token) { const res = await fetch(`${API_URL}/teachers`, { headers: authHeader(token) }); return handleRes(res); }
export async function createTeacher(token, data) { const res = await fetch(`${API_URL}/teachers`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function updateTeacher(token, id, data) { const res = await fetch(`${API_URL}/teachers/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function deleteTeacher(token, id) { const res = await fetch(`${API_URL}/teachers/${id}`, { method: 'DELETE', headers: authHeader(token) }); return handleRes(res); }

// Classes
export async function getClasses(token) { const res = await fetch(`${API_URL}/classes`, { headers: authHeader(token) }); return handleRes(res); }
export async function createClass(token, data) { const res = await fetch(`${API_URL}/classes`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function updateClass(token, id, data) { const res = await fetch(`${API_URL}/classes/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function deleteClass(token, id) { const res = await fetch(`${API_URL}/classes/${id}`, { method: 'DELETE', headers: authHeader(token) }); return handleRes(res); }

// Subjects
export async function getSubjects(token) { const res = await fetch(`${API_URL}/subjects`, { headers: authHeader(token) }); return handleRes(res); }
export async function createSubject(token, data) { const res = await fetch(`${API_URL}/subjects`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function updateSubject(token, id, data) { const res = await fetch(`${API_URL}/subjects/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function deleteSubject(token, id) { const res = await fetch(`${API_URL}/subjects/${id}`, { method: 'DELETE', headers: authHeader(token) }); return handleRes(res); }

// Assignments
export async function getAssignments(token) { const res = await fetch(`${API_URL}/assignments`, { headers: authHeader(token) }); return handleRes(res); }
export async function createAssignment(token, data) { const res = await fetch(`${API_URL}/assignments`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function updateAssignment(token, id, data) { const res = await fetch(`${API_URL}/assignments/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function deleteAssignment(token, id) { const res = await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE', headers: authHeader(token) }); return handleRes(res); }

// Timetables
export async function getTimetables(token) { const res = await fetch(`${API_URL}/timetables`, { headers: authHeader(token) }); return handleRes(res); }

// Assignment questions & submissions
export async function getQuestions(token, assignmentId) { const res = await fetch(`${API_URL}/assignments/${assignmentId}/questions`, { headers: authHeader(token) }); return handleRes(res); }
export async function createQuestion(token, assignmentId, data) { const res = await fetch(`${API_URL}/assignments/${assignmentId}/questions`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function submitAssignment(token, assignmentId, answers) { const res = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`, { method: 'POST', headers: authHeader(token), body: JSON.stringify({ answers }) }); return handleRes(res); }
export async function getSubmissions(token, assignmentId) { const res = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`, { headers: authHeader(token) }); return handleRes(res); }
export async function getAssignmentStats(token, assignmentId) { const res = await fetch(`${API_URL}/assignments/${assignmentId}/stats`, { headers: authHeader(token) }); return handleRes(res); }
export async function createTimetable(token, data) { const res = await fetch(`${API_URL}/timetables`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function updateTimetable(token, id, data) { const res = await fetch(`${API_URL}/timetables/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function deleteTimetable(token, id) { const res = await fetch(`${API_URL}/timetables/${id}`, { method: 'DELETE', headers: authHeader(token) }); return handleRes(res); }

// Enrollments
export async function getEnrollments(token) { const res = await fetch(`${API_URL}/enrollments`, { headers: authHeader(token) }); return handleRes(res); }
export async function createEnrollment(token, data) { const res = await fetch(`${API_URL}/enrollments`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function updateEnrollment(token, id, data) { const res = await fetch(`${API_URL}/enrollments/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function deleteEnrollment(token, id) { const res = await fetch(`${API_URL}/enrollments/${id}`, { method: 'DELETE', headers: authHeader(token) }); return handleRes(res); }


// Grades & Attendance (basic)
export async function createGrade(token, data) { const res = await fetch(`${API_URL}/grades`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function getGradesByStudent(token, studentId) { const res = await fetch(`${API_URL}/grades/student/${studentId}`, { headers: authHeader(token) }); return handleRes(res); }

export async function createAttendance(token, data) { const res = await fetch(`${API_URL}/attendance`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(data) }); return handleRes(res); }
export async function getAttendanceByStudent(token, studentId) { const res = await fetch(`${API_URL}/attendance/student/${studentId}`, { headers: authHeader(token) }); return handleRes(res); }
export async function getAttendanceByClass(token, classId) { const res = await fetch(`${API_URL}/attendance/class/${classId}`, { headers: authHeader(token) }); return handleRes(res); }
