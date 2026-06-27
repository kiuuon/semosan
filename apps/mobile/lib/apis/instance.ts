import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/auth-storage';

type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const refreshClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

let refreshPromise: Promise<AuthTokensResponse> | null = null;

async function refreshTokens(): Promise<AuthTokensResponse> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();

      const { data } = await refreshClient.post<AuthTokensResponse>('/auth/refresh', { refreshToken });
      await setTokens(data.accessToken, data.refreshToken);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function handleSessionExpired(): Promise<void> {
  await clearTokens();
  router.replace('/');
}

async function getInstance(): Promise<AxiosInstance> {
  const accessToken = await getAccessToken();

  const instance: AxiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    timeout: 10000,
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const response = error.response;
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      if (response?.status === 401) {
        if (response.data?.errorCode === 'ACCESS_TOKEN_EXPIRED' && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const data = await refreshTokens();
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return await instance.request(originalRequest);
          } catch {
            await handleSessionExpired();
          }
        } else if (response.data?.errorCode === 'REFRESH_TOKEN_EXPIRED') {
          await handleSessionExpired();
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

export default getInstance;
