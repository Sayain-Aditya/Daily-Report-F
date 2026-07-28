import { API_BASE } from '../constants';

export function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export function saveAuth(user, token) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function getStoredAuth() {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user'));
    const token = localStorage.getItem('auth_token');
    if (user && token) return user;
    return null;
  } catch { return null; }
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    });
  } catch { /* ignore network errors */ }
  clearAuth();
}
