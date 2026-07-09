import Toast from 'react-native-toast-message';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { resetPassword, sendEmailCode, verifyEmailCode } from '../../../lib/apis/auth';
import { renderWithProviders } from '../../../test-utils/render';

import FindPassword from './FindPassword';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  const MockIcon = ({ name }: { name: string }) => <Text>{name}</Text>;

  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
  };
});

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('../../../lib/apis/auth', () => ({
  sendEmailCode: jest.fn(),
  verifyEmailCode: jest.fn(),
  resetPassword: jest.fn(),
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

describe('FindPassword', () => {
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (sendEmailCode as jest.Mock).mockResolvedValue(undefined);
    (verifyEmailCode as jest.Mock).mockResolvedValue({ verificationToken: 'verification-token' });
    (resetPassword as jest.Mock).mockResolvedValue(undefined);
  });

  it('이메일 인증 단계를 표시한다', async () => {
    await renderWithProviders(<FindPassword onSuccess={onSuccess} />);

    expect(screen.getByPlaceholderText('example@email.com')).toBeOnTheScreen();
    expect(screen.getByText('인증 코드 보내기')).toBeOnTheScreen();
  });

  it('인증 코드 발송 시 PASSWORD_RESET 타입으로 요청하고 코드 입력 단계로 이동한다', async () => {
    await renderWithProviders(<FindPassword onSuccess={onSuccess} />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'test@example.com');
    await fireEvent.press(screen.getByText('인증 코드 보내기'));

    await waitFor(() => {
      expect(sendEmailCode).toHaveBeenCalledWith('test@example.com', 'PASSWORD_RESET');
    });
    expect(screen.getByText('코드 입력')).toBeOnTheScreen();
  });

  it('인증 코드 확인 시 PASSWORD_RESET 타입으로 요청하고 비밀번호 재설정 단계로 이동한다', async () => {
    await renderWithProviders(<FindPassword onSuccess={onSuccess} />);

    await completeEmailVerification();

    expect(verifyEmailCode).toHaveBeenCalledWith('test@example.com', '123456', 'PASSWORD_RESET');
    expect(screen.getByText('비밀번호 재설정')).toBeOnTheScreen();
  });

  it('비밀번호 변경 성공 시 resetPassword API를 호출하고 onSuccess를 호출한다', async () => {
    await renderWithProviders(<FindPassword onSuccess={onSuccess} />);

    await completeEmailVerification();

    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 한 번 더 입력하세요'), 'password123');
    await fireEvent.press(screen.getByText('비밀번호 변경'));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('test@example.com', 'verification-token', 'password123');
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: '비밀번호가 변경되었습니다.',
      text2: '새 비밀번호로 로그인해 주세요.',
    });
  });
});
