import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('itm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('itm_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('itm_token');
        localStorage.removeItem('itm_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      if (!refreshPromise) {
        refreshPromise = axios
          .post(BASE_URL + '/api/auth/refresh', { refreshToken })
          .then((res) => {
            localStorage.setItem('itm_token', res.data.token);
            localStorage.setItem('itm_refresh_token', res.data.refreshToken);
            return res.data.token;
          })
          .catch(() => {
            localStorage.removeItem('itm_token');
            localStorage.removeItem('itm_refresh_token');
            window.location.href = '/login';
          })
          .finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
