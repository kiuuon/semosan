import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../../common/typography/Typography';
import colors from '../../../lib/constants/colors';
import { EmailVerificationType, sendEmailCode } from '../../../lib/apis/auth';
import Button from '../../common/button/Button';
import Input from '../../common/input/Input';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FORM_COPY: Record<EmailVerificationType, { title: string; description: string; submit: string }> = {
  SIGNUP: {
    title: '이메일 인증',
    description: '사용할 이메일 주소를 입력하면 6자리 인증 코드를 보내드릴게요.',
    submit: '인증 코드 보내기',
  },
  PASSWORD_RESET: {
    title: '이메일 확인',
    description: '가입할 때 사용한 이메일을 입력하면 6자리 인증 코드를 보내드릴게요.',
    submit: '인증 코드 보내기',
  },
};

function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim());
}

interface EmailFormProps {
  type: EmailVerificationType;
  email: string;
  setEmail: (email: string) => void;
  setStep: (step: 'email-verification') => void;
}

function EmailForm({ type, email, setEmail, setStep }: EmailFormProps) {
  const [emailError, setEmailError] = useState<string | null>(null);

  const copy = FORM_COPY[type];

  const { mutate: sendCode, isPending: isSendingCode } = useMutation({
    mutationFn: () => sendEmailCode(email.trim(), type),
    onSuccess: () => {
      setStep('email-verification');
    },
  });

  function handleEmailChange(text: string) {
    setEmail(text);
    if (emailError) {
      setEmailError(null);
    }
  }

  function handleSendCode() {
    if (isSendingCode) return;

    if (!isValidEmail(email)) {
      setEmailError('올바른 이메일 형식을 입력해 주세요.');
      return;
    }

    sendCode();
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Typography.Display>{copy.title}</Typography.Display>
          <Typography.BodyBase>{copy.description}</Typography.BodyBase>
        </View>

        <Input
          value={email}
          onChangeText={handleEmailChange}
          label="이메일"
          placeholder="example@email.com"
          accessoryLeft={<Ionicons name="mail-outline" size={17} color={colors.stone500} />}
          status={emailError ? 'error' : 'default'}
          caption={emailError ?? undefined}
        />
      </View>

      <Button onPress={handleSendCode} disabled={!email.trim() || isSendingCode} loading={isSendingCode} fullWidth>
        {copy.submit}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    gap: 32,
  },
  titleContainer: {
    gap: 8,
  },
});

export default EmailForm;
