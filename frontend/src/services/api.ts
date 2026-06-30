import axios from 'axios';

const api = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_URL || '') + '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Authorization Bearer token header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dsa_master_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch a custom event to notify stores/components without circular dependencies
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
        
        // Redirect to login if not already on public routes
        const publicPaths = ['/', '/login', '/register'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
