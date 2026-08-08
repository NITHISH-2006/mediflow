import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'https://mediflow-backend-tmug.onrender.com/api';
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error?.response?.data?.message || 'Request failed';
    return Promise.reject(new Error(message));
  },
);

export const unwrap = (response) => response?.data?.data ?? response?.data ?? response;
export const unwrapEnvelope = (response) => response?.data;

export default api;
