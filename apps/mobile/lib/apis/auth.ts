import { clearTokens, getRefreshToken, setTokens } from '../utils/auth-storage';
import getInstance from './instance';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  _id: string;
  email: string;
  nickname: string;
  status: string;
  height?: number;
  weight?: number;
  gender?: string;
  age?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerifyEmailCodeResponse {
  verificationToken: string;
}

export type EmailVerificationType = 'SIGNUP' | 'PASSWORD_RESET';

export async function sendEmailCode(email: string, type: EmailVerificationType = 'SIGNUP'): Promise<void> {
  const instance = await getInstance();
  await instance.post('/auth/email/send-code', { email: email.trim(), type });
}

export async function verifyEmailCode(
  email: string,
  code: string,
  type: EmailVerificationType = 'SIGNUP',
): Promise<VerifyEmailCodeResponse> {
  const instance = await getInstance();
  const response = await instance.post<VerifyEmailCodeResponse>('/auth/email/verify-code', {
    email: email.trim(),
    type,
    code,
  });
  return response.data;
}

export async function resetPassword(email: string, verificationToken: string, newPassword: string): Promise<void> {
  const instance = await getInstance();
  await instance.post('/auth/password/reset', {
    email: email.trim(),
    verificationToken,
    newPassword,
  });
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

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    const instance = await getInstance();
    await instance.post('/auth/logout', { refreshToken });
  }

  await clearTokens();
}

export async function getMe(): Promise<UserProfile> {
  const instance = await getInstance();
  const response = await instance.get<UserProfile>('/auth/me');
  return response.data;
}
