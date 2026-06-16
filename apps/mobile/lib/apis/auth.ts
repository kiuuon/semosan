import { clearTokens, getRefreshToken, setTokens } from '../utils/auth-storage';
import getInstance from './instance';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyEmailCodeResponse {
  verificationToken: string;
}

export async function sendEmailCode(email: string): Promise<void> {
  const instance = await getInstance();
  await instance.post('/auth/email/send-code', { email: email.trim() });
}

export async function verifyEmailCode(email: string, code: string): Promise<VerifyEmailCodeResponse> {
  const instance = await getInstance();
  const response = await instance.post<VerifyEmailCodeResponse>('/auth/email/verify-code', {
    email: email.trim(),
    code,
  });
  return response.data;
}

export async function signUp(email: string, password: string, verificationToken: string): Promise<AuthTokensResponse> {
  const instance = await getInstance();
  const response = await instance.post('/users', {
    email: email.trim(),
    password,
    verificationToken,
  });

  const data = response.data as AuthTokensResponse;
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function login(email: string, password: string): Promise<AuthTokensResponse> {
  const instance = await getInstance();
  const response = await instance.post('/auth/login', { email, password });

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
