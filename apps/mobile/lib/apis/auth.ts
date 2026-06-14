import { clearTokens, getRefreshToken, setTokens } from '../utils/auth-storage';
import getInstance from './instance';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export async function signUp(email: string, password: string): Promise<AuthTokensResponse> {
  const instance = await getInstance();
  const response = await instance.post('/users', { email, password });

  if (response.status !== 201) {
    throw new Error('회원가입에 실패했습니다. 다시 시도해 주세요.');
  }

  const data = response.data as AuthTokensResponse;
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function login(email: string, password: string): Promise<AuthTokensResponse> {
  const instance = await getInstance();
  const response = await instance.post('/auth/login', { email, password });

  if (response.status !== 201) {
    throw new Error('로그인에 실패했습니다. 다시 시도해 주세요.');
  }

  const data = response.data as AuthTokensResponse;
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function refreshSession(): Promise<AuthTokensResponse | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const instance = await getInstance();
  const response = await instance.post('/auth/refresh', { refreshToken });

  if (response.status !== 200) {
    await clearTokens();
    return null;
  }

  const data = response.data as AuthTokensResponse;
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    const instance = await getInstance();
    await instance.post('/auth/logout', { refreshToken });
  }

  await clearTokens();
}
