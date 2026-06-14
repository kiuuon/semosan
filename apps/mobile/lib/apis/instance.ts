import axios, { AxiosInstance } from 'axios';
import { router } from 'expo-router';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/auth-storage';

async function getInstance(): Promise<AxiosInstance> {
  const accessToken = await getAccessToken();

  const instance: AxiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response.status === 401) {
        if (error.response.data.errorCode === 'ACCESS_TOKEN_EXPIRED') {
          try {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await instance.post(
              '/auth/refresh',
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              },
            );

            await setTokens(data.accessToken, data.refreshToken);

            const newError = error;
            newError.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return await instance.request(newError.config);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        } else if (error.response.data.errorCode === 'REFRESH_TOKEN_EXPIRED') {
          await clearTokens();

          router.replace('/');
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export default getInstance;
