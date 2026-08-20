import { clearTokens, getRefreshToken, setTokens } from '../utils/auth-storage';
import { login, logout, resetPassword, sendEmailCode, signUp, verifyEmailCode } from './auth';
import getInstance from './instance';

jest.mock('./instance');
jest.mock('../utils/auth-storage', () => ({
  clearTokens: jest.fn(),
  getRefreshToken: jest.fn(),
  setTokens: jest.fn(),
}));

const mockPost = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getInstance as jest.Mock).mockResolvedValue({ post: mockPost });
});

describe('auth', () => {
  describe('sendEmailCode', () => {
    it('이메일 인증 코드 발송 API를 호출한다', async () => {
      mockPost.mockResolvedValue({ data: undefined });

      await sendEmailCode('  test@example.com  ');

      expect(getInstance).toHaveBeenCalled();
      expect(mockPost).toHaveBeenCalledWith('/auth/email/send-code', {
        email: 'test@example.com',
        type: 'SIGNUP',
      });
    });

    it('인증 타입을 지정할 수 있다', async () => {
      mockPost.mockResolvedValue({ data: undefined });

      await sendEmailCode('test@example.com', 'PASSWORD_RESET');

      expect(mockPost).toHaveBeenCalledWith('/auth/email/send-code', {
        email: 'test@example.com',
        type: 'PASSWORD_RESET',
      });
    });
  });

  describe('verifyEmailCode', () => {
    it('이메일 인증 코드 확인 API를 호출하고 verificationToken을 반환한다', async () => {
      mockPost.mockResolvedValue({ data: { verificationToken: 'verification-token' } });

      await expect(verifyEmailCode('  test@example.com  ', '123456')).resolves.toEqual({
        verificationToken: 'verification-token',
      });
      expect(mockPost).toHaveBeenCalledWith('/auth/email/verify-code', {
        email: 'test@example.com',
        type: 'SIGNUP',
        code: '123456',
      });
    });
  });

  describe('resetPassword', () => {
    it('비밀번호 재설정 API를 호출한다', async () => {
      mockPost.mockResolvedValue({ data: undefined });

      await resetPassword('  test@example.com  ', 'verification-token', 'new-password');

      expect(mockPost).toHaveBeenCalledWith('/auth/password/reset', {
        email: 'test@example.com',
        verificationToken: 'verification-token',
        newPassword: 'new-password',
      });
    });
  });

  describe('signUp', () => {
    it('회원가입 API를 호출하고 토큰을 저장한다', async () => {
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      mockPost.mockResolvedValue({ data: tokens });

      await expect(signUp('  test@example.com  ', 'password', 'verification-token')).resolves.toEqual(tokens);
      expect(mockPost).toHaveBeenCalledWith('/users', {
        email: 'test@example.com',
        password: 'password',
        verificationToken: 'verification-token',
        agreedTerms: true,
        agreedPrivacy: true,
      });
      expect(setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });
  });

  describe('login', () => {
    it('로그인 API를 호출하고 토큰을 저장한다', async () => {
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      mockPost.mockResolvedValue({ data: tokens });

      await expect(login('test@example.com', 'password')).resolves.toEqual(tokens);
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });
      expect(setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });
  });

  describe('logout', () => {
    it('refresh token이 있으면 로그아웃 API를 호출하고 토큰을 삭제한다', async () => {
      (getRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      mockPost.mockResolvedValue({ data: undefined });

      await logout();

      expect(mockPost).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-token' });
      expect(clearTokens).toHaveBeenCalled();
    });

    it('refresh token이 없으면 로그아웃 API를 호출하지 않고 토큰만 삭제한다', async () => {
      (getRefreshToken as jest.Mock).mockResolvedValue(null);

      await logout();

      expect(getInstance).not.toHaveBeenCalled();
      expect(mockPost).not.toHaveBeenCalled();
      expect(clearTokens).toHaveBeenCalled();
    });
  });
});
