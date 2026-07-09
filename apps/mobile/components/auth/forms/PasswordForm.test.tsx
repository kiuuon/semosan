import Toast from 'react-native-toast-message';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { resetPassword, signUp } from '../../../lib/apis/auth';
import { renderWithProviders } from '../../../test-utils/render';

import PasswordForm from './PasswordForm';

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('../../../lib/apis/auth', () => ({
  signUp: jest.fn(),
  resetPassword: jest.fn(),
}));

describe('PasswordForm', () => {
  const onComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (signUp as jest.Mock).mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    (resetPassword as jest.Mock).mockResolvedValue(undefined);
  });

  describe('회원가입', () => {
    it('비밀번호 설정 단계를 표시한다', async () => {
      await renderWithProviders(
        <PasswordForm
          type="SIGNUP"
          email="test@example.com"
          verificationToken="verification-token"
          onComplete={onComplete}
        />,
      );

      expect(screen.getByText('비밀번호 설정')).toBeOnTheScreen();
      expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeOnTheScreen();
      expect(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요')).toBeOnTheScreen();
      expect(screen.getByText('회원가입 완료')).toBeOnTheScreen();
    });

    it('비밀번호 요건을 충족하지 않으면 회원가입 완료 버튼이 비활성화된다', async () => {
      await renderWithProviders(
        <PasswordForm
          type="SIGNUP"
          email="test@example.com"
          verificationToken="verification-token"
          onComplete={onComplete}
        />,
      );

      expect(screen.getByText('회원가입 완료')).toBeDisabled();
    });

    it('비밀번호 입력 시 요건 안내를 표시한다', async () => {
      await renderWithProviders(
        <PasswordForm
          type="SIGNUP"
          email="test@example.com"
          verificationToken="verification-token"
          onComplete={onComplete}
        />,
      );

      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'pass1');

      expect(screen.getByText('8자 이상')).toBeOnTheScreen();
      expect(screen.getByText('영문 포함')).toBeOnTheScreen();
      expect(screen.getByText('숫자 포함')).toBeOnTheScreen();
    });

    it('비밀번호가 일치하지 않으면 에러 메시지를 표시한다', async () => {
      await renderWithProviders(
        <PasswordForm
          type="SIGNUP"
          email="test@example.com"
          verificationToken="verification-token"
          onComplete={onComplete}
        />,
      );

      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요'), 'different');

      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeOnTheScreen();
      expect(screen.getByText('회원가입 완료')).toBeDisabled();
    });

    it('인증 토큰이 없으면 토스트를 표시하고 API를 호출하지 않는다', async () => {
      await renderWithProviders(
        <PasswordForm type="SIGNUP" email="test@example.com" verificationToken={null} onComplete={onComplete} />,
      );

      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요'), 'password123');
      await fireEvent.press(screen.getByText('회원가입 완료'));

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: '이메일 인증이 필요합니다.',
      });
      expect(signUp).not.toHaveBeenCalled();
    });

    it('회원가입 성공 시 signUp API를 호출하고 onComplete를 호출한다', async () => {
      await renderWithProviders(
        <PasswordForm
          type="SIGNUP"
          email="test@example.com"
          verificationToken="verification-token"
          onComplete={onComplete}
        />,
      );

      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요'), 'password123');
      await fireEvent.press(screen.getByText('회원가입 완료'));

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'verification-token');
      });
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('비밀번호 재설정', () => {
    it('비밀번호 재설정 단계를 표시한다', async () => {
      await renderWithProviders(
        <PasswordForm
          type="PASSWORD_RESET"
          email="test@example.com"
          verificationToken="verification-token"
          onComplete={onComplete}
        />,
      );

      expect(screen.getByText('비밀번호 재설정')).toBeOnTheScreen();
      expect(screen.getByText('비밀번호 변경')).toBeOnTheScreen();
    });

    it('재설정 성공 시 resetPassword API를 호출하고 onComplete를 호출한다', async () => {
      await renderWithProviders(
        <PasswordForm
          type="PASSWORD_RESET"
          email="test@example.com"
          verificationToken="verification-token"
          onComplete={onComplete}
        />,
      );

      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
      await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요'), 'password123');
      await fireEvent.press(screen.getByText('비밀번호 변경'));

      await waitFor(() => {
        expect(resetPassword).toHaveBeenCalledWith('test@example.com', 'verification-token', 'password123');
      });
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
      expect(signUp).not.toHaveBeenCalled();
    });
  });
});
