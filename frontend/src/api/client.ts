import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000';

if (import.meta.env.DEV) {
  console.info('[api] baseURL =', rawBase);
}

export const api = axios.create({
  baseURL: rawBase,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    config.headers.set('X-User-Id', userId);
  }
  return config;
});
