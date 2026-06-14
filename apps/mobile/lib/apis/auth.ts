import axios from 'axios';

import { clearTokens, getRefreshToken, setTokens } from '../utils/auth-storage';
import getInstance from './instance';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyEmailCodeResponse {
  verificationToken: string;
}

const publicClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function sendEmailCode(email: string): Promise<void> {
  try {
    await publicClient.post('/auth/email/send-code', { email: email.trim() });
  } catch (error) {
    throw new Error(getErrorMessage(error, '인증 코드 발송에 실패했습니다.'));
  }
}

export async function verifyEmailCode(email: string, code: string): Promise<VerifyEmailCodeResponse> {
  try {
    const response = await publicClient.post<VerifyEmailCodeResponse>('/auth/email/verify-code', {
      email: email.trim(),
      code,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, '이메일 인증에 실패했습니다.'));
  }
}

export async function signUp(email: string, password: string, verificationToken: string): Promise<AuthTokensResponse> {
  const instance = await getInstance();
  const response = await instance.post('/users', {
    email: email.trim(),
    password,
    verificationToken,
  });

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
