import { useState } from 'react';
import { Text } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { sendEmailCode } from '../../../lib/apis/auth';
import { renderWithProviders } from '../../../test-utils/render';

import EmailForm from './EmailForm';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock('../../../lib/apis/auth', () => ({
  sendEmailCode: jest.fn(),
}));

function TestEmailForm() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<string | null>(null);

  return (
    <>
      <EmailForm email={email} setEmail={setEmail} setStep={setStep} />
      {step ? <Text>{step}</Text> : null}
    </>
  );
}

describe('EmailForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sendEmailCode as jest.Mock).mockResolvedValue(undefined);
  });

  it('이메일 인증 단계를 표시한다', async () => {
    await renderWithProviders(<TestEmailForm />);

    expect(screen.getByText('이메일 인증')).toBeOnTheScreen();
    expect(screen.getByText('인증 코드 보내기')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('example@email.com')).toBeOnTheScreen();
  });

  it('이메일이 비어 있으면 인증 코드 보내기 버튼이 비활성화된다', async () => {
    await renderWithProviders(<TestEmailForm />);

    expect(screen.getByText('인증 코드 보내기')).toBeDisabled();
  });

  it('올바르지 않은 이메일이면 에러 메시지를 표시한다', async () => {
    await renderWithProviders(<TestEmailForm />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'invalid-email');
    await fireEvent.press(screen.getByText('인증 코드 보내기'));

    expect(screen.getByText('올바른 이메일 형식을 입력해 주세요.')).toBeOnTheScreen();
    expect(sendEmailCode).not.toHaveBeenCalled();
  });

  it('유효한 이메일이면 인증 코드를 발송하고 다음 단계로 이동한다', async () => {
    await renderWithProviders(<TestEmailForm />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), '  test@example.com  ');
    await fireEvent.press(screen.getByText('인증 코드 보내기'));

    await waitFor(() => {
      expect(sendEmailCode).toHaveBeenCalledWith('test@example.com', 'SIGNUP');
    });
    expect(screen.getByText('email-verification')).toBeOnTheScreen();
  });

  it('에러 발생 후 이메일을 수정하면 에러 메시지를 제거한다', async () => {
    await renderWithProviders(<TestEmailForm />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'invalid-email');
    await fireEvent.press(screen.getByText('인증 코드 보내기'));
    expect(screen.getByText('올바른 이메일 형식을 입력해 주세요.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'test@example.com');

    expect(screen.queryByText('올바른 이메일 형식을 입력해 주세요.')).not.toBeOnTheScreen();
  });
});
