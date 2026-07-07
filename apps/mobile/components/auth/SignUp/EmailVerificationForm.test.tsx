import { useState } from 'react';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { sendEmailCode, verifyEmailCode } from '../../../lib/apis/auth';
import { renderWithProviders } from '../../../test-utils/render';

import EmailVerificationForm from './EmailVerificationForm';

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('../../../lib/apis/auth', () => ({
  sendEmailCode: jest.fn(),
  verifyEmailCode: jest.fn(),
}));

function TestEmailVerificationForm({ initialEmail = 'test@example.com' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [step, setStep] = useState<string>('email-verification');

  return (
    <>
      <EmailVerificationForm
        email={email}
        setEmail={setEmail}
        code={code}
        setCode={setCode}
        setVerificationToken={setVerificationToken}
        setStep={setStep}
      />
      {verificationToken ? <Text testID="verification-token">{verificationToken}</Text> : null}
      {step !== 'email-verification' ? <Text testID="current-step">{step}</Text> : null}
      {email === '' ? <Text testID="email-cleared">cleared</Text> : null}
    </>
  );
}

describe('EmailVerificationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sendEmailCode as jest.Mock).mockResolvedValue(undefined);
    (verifyEmailCode as jest.Mock).mockResolvedValue({ verificationToken: 'verification-token' });
  });

  it('코드 입력 단계를 표시한다', async () => {
    await renderWithProviders(<TestEmailVerificationForm />);

    expect(screen.getByText('코드 입력')).toBeOnTheScreen();
    expect(screen.getByText('test@example.com')).toBeOnTheScreen();
    expect(screen.getByLabelText('인증 코드 입력')).toBeOnTheScreen();
    expect(screen.getByText('인증 확인')).toBeOnTheScreen();
  });

  it('코드가 비어 있으면 인증 확인 버튼이 비활성화된다', async () => {
    await renderWithProviders(<TestEmailVerificationForm />);

    expect(screen.getByText('인증 확인')).toBeDisabled();
  });

  it('인증 확인을 누르면 verifyEmailCode API를 호출하고 다음 단계로 이동한다', async () => {
    await renderWithProviders(<TestEmailVerificationForm />);

    await fireEvent.changeText(screen.getByLabelText('인증 코드 입력'), '123456');
    await fireEvent.press(screen.getByText('인증 확인'));

    await waitFor(() => {
      expect(verifyEmailCode).toHaveBeenCalledWith('test@example.com', '123456', 'SIGNUP');
    });
    expect(screen.getByTestId('verification-token')).toHaveTextContent('verification-token');
    expect(screen.getByTestId('current-step')).toHaveTextContent('password');
  });

  it('코드 재발송을 누르면 sendEmailCode API를 호출하고 토스트를 표시한다', async () => {
    await renderWithProviders(<TestEmailVerificationForm />);

    await fireEvent.press(screen.getByText('코드 재발송'));

    await waitFor(() => {
      expect(sendEmailCode).toHaveBeenCalledWith('test@example.com', 'SIGNUP');
    });
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: '코드가 재발송되었습니다.',
    });
  });

  it('이메일 주소 변경을 누르면 이메일 단계로 돌아간다', async () => {
    await renderWithProviders(<TestEmailVerificationForm />);

    await fireEvent.press(screen.getByText('이메일 주소 변경'));

    expect(screen.getByTestId('current-step')).toHaveTextContent('email');
    expect(screen.getByTestId('email-cleared')).toBeOnTheScreen();
  });
});
