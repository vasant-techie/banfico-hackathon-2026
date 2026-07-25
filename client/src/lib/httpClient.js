import axios from 'axios';

export const httpClient = axios.create({ baseURL: '/api' });

let accessToken = null;
let refreshToken = null;
let onRefreshFail = () => {};
let refreshPromise = null;

export function setTokens(tokens) {
  accessToken = tokens?.access_token ?? null;
  refreshToken = tokens?.refresh_token ?? null;
}

export function setOnRefreshFail(fn) {
  onRefreshFail = fn;
}

httpClient.interceptors.request.use((requestConfig) => {
  if (accessToken) requestConfig.headers.Authorization = `Bearer ${accessToken}`;
  return requestConfig;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && refreshToken && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh', { refresh_token: refreshToken })
            .then((res) => res.data)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const data = await refreshPromise;
        setTokens(data);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return httpClient(original);
      } catch (refreshErr) {
        onRefreshFail();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
