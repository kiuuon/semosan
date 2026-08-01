import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { sendEmailCode, signUp, verifyEmailCode } from '../../../lib/apis/auth';
import { renderWithProviders } from '../../../test-utils/render';

import SignUp from './SignUp';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  const MockIcon = ({ name }: { name: string }) => <Text>{name}</Text>;

  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
  };
});

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
  await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), email);
  await fireEvent.press(screen.getByText('인증 코드 보내기'));

  await waitFor(() => {
    expect(screen.getByText('코드 입력')).toBeOnTheScreen();
  });

  await fireEvent.changeText(screen.getByLabelText('인증 코드 입력'), code);
  await fireEvent.press(screen.getByText('인증 확인'));

  await waitFor(() => {
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeOnTheScreen();
  });
}

describe('SignUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sendEmailCode as jest.Mock).mockResolvedValue(undefined);
    (verifyEmailCode as jest.Mock).mockResolvedValue({ verificationToken: 'verification-token' });
    (signUp as jest.Mock).mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('이메일 인증 단계를 표시한다', async () => {
    await renderWithProviders(<SignUp />);

    expect(screen.getByPlaceholderText('example@email.com')).toBeOnTheScreen();
    expect(screen.getByText('인증 코드 보내기')).toBeOnTheScreen();
  });

  it('이메일이 비어 있으면 인증 코드 보내기 버튼이 비활성화된다', async () => {
    await renderWithProviders(<SignUp />);

    expect(screen.getByText('인증 코드 보내기')).toBeDisabled();
  });

  it('인증 코드 발송 후 코드 입력 단계로 이동한다', async () => {
    await renderWithProviders(<SignUp />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'test@example.com');
    await fireEvent.press(screen.getByText('인증 코드 보내기'));

    await waitFor(() => {
      expect(sendEmailCode).toHaveBeenCalledWith('test@example.com', 'SIGNUP');
    });
    expect(screen.getByText('코드 입력')).toBeOnTheScreen();
    expect(screen.getByLabelText('인증 코드 입력')).toBeOnTheScreen();
  });

  it('인증 코드 확인 후 비밀번호 설정 단계로 이동한다', async () => {
    await renderWithProviders(<SignUp />);

    await completeEmailVerification();

    expect(verifyEmailCode).toHaveBeenCalledWith('test@example.com', '123456', 'SIGNUP');
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeOnTheScreen();
  });

  it('비밀번호가 일치하지 않으면 에러 메시지를 표시한다', async () => {
    await renderWithProviders(<SignUp />);

    await completeEmailVerification();

    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요'), 'different');

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeOnTheScreen();
    expect(screen.getByText('회원가입 완료')).toBeDisabled();
  });

  it('회원가입 성공 시 signUp API를 호출하고 이전 화면으로 돌아간다', async () => {
    await renderWithProviders(<SignUp />);

    await completeEmailVerification();

    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요'), 'password123');
    await fireEvent.press(screen.getByText('회원가입 완료'));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'verification-token');
    });
    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });
});
