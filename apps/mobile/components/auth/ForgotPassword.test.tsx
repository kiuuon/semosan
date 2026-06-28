import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { resetPassword, sendEmailCode, verifyEmailCode } from '../../lib/apis/auth';
import { renderWithProviders } from '../../test-utils/render';
import { ForgotPassword } from './ForgotPassword';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('../../lib/apis/auth', () => ({
  sendEmailCode: jest.fn(),
  verifyEmailCode: jest.fn(),
  resetPassword: jest.fn(),
}));

async function completeCodeVerification(email = 'test@example.com', code = '123456') {
  await fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), email);
  await fireEvent.press(screen.getByText('인증 코드 보내기'));

  await waitFor(() => {
    expect(screen.getByPlaceholderText('6자리 코드')).toBeOnTheScreen();
  });

  await fireEvent.changeText(screen.getByPlaceholderText('6자리 코드'), code);
  await fireEvent.press(screen.getByText('다음'));

  await waitFor(() => {
    expect(screen.getByText('새 비밀번호를 설정해 주세요')).toBeOnTheScreen();
  });
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (sendEmailCode as jest.Mock).mockResolvedValue(undefined);
    (verifyEmailCode as jest.Mock).mockResolvedValue({ verificationToken: 'verification-token' });
    (resetPassword as jest.Mock).mockResolvedValue(undefined);
  });

  it('이메일 입력 단계를 표시한다', async () => {
    await renderWithProviders(<ForgotPassword />);

    expect(screen.getByText('가입한 이메일로 비밀번호 재설정 인증 코드를 보내드립니다')).toBeOnTheScreen();
    expect(screen.getByText('인증 코드 보내기')).toBeOnTheScreen();
  });

  it('이메일이 비어 있으면 인증 코드 보내기 버튼이 비활성화된다', async () => {
    await renderWithProviders(<ForgotPassword />);

    expect(screen.getByText('인증 코드 보내기')).toBeDisabled();
  });

  it('인증 코드 발송 후 코드 입력 단계로 이동한다', async () => {
    await renderWithProviders(<ForgotPassword />);

    await fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
    await fireEvent.press(screen.getByText('인증 코드 보내기'));

    await waitFor(() => {
      expect(sendEmailCode).toHaveBeenCalledWith('test@example.com', 'PASSWORD_RESET');
    });
    expect(screen.getByText('메일함에서 6자리 인증 코드를 확인해 주세요')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('6자리 코드')).toBeOnTheScreen();
    expect(Alert.alert).toHaveBeenCalledWith('인증 코드를 발송했습니다.', '메일함에서 6자리 코드를 확인해 주세요.');
  });

  it('인증 코드 확인 후 비밀번호 재설정 단계로 이동한다', async () => {
    await renderWithProviders(<ForgotPassword />);

    await completeCodeVerification();

    expect(verifyEmailCode).toHaveBeenCalledWith('test@example.com', '123456', 'PASSWORD_RESET');
  });

  it('비밀번호가 일치하지 않으면 에러 메시지를 표시한다', async () => {
    await renderWithProviders(<ForgotPassword />);

    await completeCodeVerification();

    await fireEvent.changeText(screen.getByPlaceholderText('8자 이상'), 'password123');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호 다시 입력'), 'different');

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeOnTheScreen();
    expect(screen.getByText('비밀번호 변경')).toBeDisabled();
  });

  it('비밀번호 변경 성공 시 resetPassword API를 호출하고 이전 화면으로 돌아간다', async () => {
    await renderWithProviders(<ForgotPassword />);

    await completeCodeVerification();

    await fireEvent.changeText(screen.getByPlaceholderText('8자 이상'), 'password123');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호 다시 입력'), 'password123');
    await fireEvent.press(screen.getByText('비밀번호 변경'));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('test@example.com', 'verification-token', 'password123');
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('완료', '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
    });
    expect(router.back).toHaveBeenCalled();
  });
});
