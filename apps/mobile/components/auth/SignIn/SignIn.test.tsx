import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { login } from '../../../lib/apis/auth';
import { renderWithProviders } from '../../../test-utils/render';
import SignIn from './SignIn';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('../../../lib/apis/auth', () => ({
  login: jest.fn(),
}));

describe('SignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (login as jest.Mock).mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('로그인 화면을 표시한다', async () => {
    await renderWithProviders(<SignIn onSwitchToSignUp={jest.fn()} />);

    expect(screen.getByText('세모산')).toBeOnTheScreen();
    expect(screen.getByText('산을 오르는 모든 순간을 함께')).toBeOnTheScreen();
    expect(screen.getByText('로그인')).toBeOnTheScreen();
  });

  it('이메일과 비밀번호가 비어 있으면 로그인 버튼이 비활성화된다', async () => {
    await renderWithProviders(<SignIn onSwitchToSignUp={jest.fn()} />);

    expect(screen.getByText('로그인')).toBeDisabled();
  });

  it('이메일과 비밀번호를 입력하면 로그인 API를 호출한다', async () => {
    await renderWithProviders(<SignIn onSwitchToSignUp={jest.fn()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), '  test@example.com  ');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await fireEvent.press(screen.getByText('로그인'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('로그인 성공 시 홈 화면으로 이동한다', async () => {
    await renderWithProviders(<SignIn onSwitchToSignUp={jest.fn()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'test@example.com');
    await fireEvent.changeText(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await fireEvent.press(screen.getByText('로그인'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
    });
  });

  it('회원가입 링크를 누르면 onSwitchToSignUp을 호출한다', async () => {
    const onSwitchToSignUp = jest.fn();
    await renderWithProviders(<SignIn onSwitchToSignUp={onSwitchToSignUp} />);

    await fireEvent.press(screen.getByText('회원가입'));

    expect(onSwitchToSignUp).toHaveBeenCalledTimes(1);
  });

  it('비밀번호 찾기 링크를 누르면 비밀번호 찾기 화면으로 이동한다', async () => {
    await renderWithProviders(<SignIn onSwitchToSignUp={jest.fn()} />);

    await fireEvent.press(screen.getByText('비밀번호 찾기'));

    expect(router.push).toHaveBeenCalledWith('/auth/forgot-password');
  });
});
