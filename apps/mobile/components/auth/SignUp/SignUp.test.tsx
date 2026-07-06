import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { sendEmailCode, signUp, verifyEmailCode } from '../../../lib/apis/auth';
import { renderWithProviders } from '../../../test-utils/render';
import { SignUp } from './SignUp';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('../../../lib/apis/auth', () => ({
  sendEmailCode: jest.fn(),
  verifyEmailCode: jest.fn(),
  signUp: jest.fn(),
}));

async function completeEmailVerification(email = 'test@example.com', code = '123456') {
  await fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), email);
  await fireEvent.press(screen.getByText('인증 코드 받기'));

  await waitFor(() => {
    expect(screen.getByPlaceholderText('6자리 코드')).toBeOnTheScreen();
  });

  await fireEvent.changeText(screen.getByPlaceholderText('6자리 코드'), code);
  await fireEvent.press(screen.getByText('다음'));

  await waitFor(() => {
    expect(screen.getByText('비밀번호를 설정하세요')).toBeOnTheScreen();
  });
}

describe('SignUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (sendEmailCode as jest.Mock).mockResolvedValue(undefined);
    (verifyEmailCode as jest.Mock).mockResolvedValue({ verificationToken: 'verification-token' });
    (signUp as jest.Mock).mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('이메일 인증 단계를 표시한다', async () => {
    await renderWithProviders(<SignUp onSwitchToSignIn={jest.fn()} />);

    expect(screen.getByText('이메일 인증 후 계정을 만드세요')).toBeOnTheScreen();
    expect(screen.getByText('인증 코드 받기')).toBeOnTheScreen();
  });

  it('이메일이 비어 있으면 인증 코드 받기 버튼이 비활성화된다', async () => {
    await renderWithProviders(<SignUp onSwitchToSignIn={jest.fn()} />);

    expect(screen.getByText('인증 코드 받기')).toBeDisabled();
  });

  it('인증 코드 발송 후 코드 입력란을 표시한다', async () => {
    await renderWithProviders(<SignUp onSwitchToSignIn={jest.fn()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
    await fireEvent.press(screen.getByText('인증 코드 받기'));

    await waitFor(() => {
      expect(sendEmailCode).toHaveBeenCalledWith('test@example.com', 'SIGNUP');
    });
    expect(screen.getByPlaceholderText('6자리 코드')).toBeOnTheScreen();
    expect(Alert.alert).toHaveBeenCalledWith('인증 코드를 발송했습니다.', '메일함에서 6자리 코드를 확인해 주세요.');
  });

  it('인증 코드 확인 후 비밀번호 설정 단계로 이동한다', async () => {
    await renderWithProviders(<SignUp onSwitchToSignIn={jest.fn()} />);

    await completeEmailVerification();

    expect(verifyEmailCode).toHaveBeenCalledWith('test@example.com', '123456', 'SIGNUP');
  });

  it('비밀번호가 일치하지 않으면 에러 메시지를 표시한다', async () => {
    await renderWithProviders(<SignUp onSwitchToSignIn={jest.fn()} />);

    await completeEmailVerification();

    await fireEvent.changeText(screen.getByPlaceholderText('8자 이상'), 'password123');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호 다시 입력'), 'different');

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeOnTheScreen();
    expect(screen.getByText('회원가입')).toBeDisabled();
  });

  it('회원가입 성공 시 signUp API를 호출하고 홈 화면으로 이동한다', async () => {
    await renderWithProviders(<SignUp onSwitchToSignIn={jest.fn()} />);

    await completeEmailVerification();

    await fireEvent.changeText(screen.getByPlaceholderText('8자 이상'), 'password123');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호 다시 입력'), 'password123');
    await fireEvent.press(screen.getByText('회원가입'));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'verification-token');
    });
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
    });
  });

  it('로그인 링크를 누르면 onSwitchToSignIn을 호출한다', async () => {
    const onSwitchToSignIn = jest.fn();
    await renderWithProviders(<SignUp onSwitchToSignIn={onSwitchToSignIn} />);

    await fireEvent.press(screen.getByText('로그인'));

    expect(onSwitchToSignIn).toHaveBeenCalledTimes(1);
  });
});
