import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../../common/Typography/Typography';
import colors from '../../../lib/constants/colors';
import { sendEmailCode } from '../../../lib/apis/auth';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim());
}

interface EmailFormProps {
  email: string;
  setEmail: (email: string) => void;
  setStep: (step: 'email-verification') => void;
}

function EmailForm({ email, setEmail, setStep }: EmailFormProps) {
  const [emailError, setEmailError] = useState<string | null>(null);

  const { mutate: sendCode, isPending: isSendingCode } = useMutation({
    mutationFn: () => sendEmailCode(email.trim(), 'SIGNUP'),
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
          <Typography.Display>이메일 인증</Typography.Display>
          <Typography.BodyBase>사용할 이메일 주소를 입력하면 {'\n'}6자리 인증 코드를 보내드릴게요.</Typography.BodyBase>
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
        인증 코드 보내기
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
