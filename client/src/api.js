const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function signup(data) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getDashboard(token) {
  const res = await fetch(`${API_URL}/dashboard/admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
