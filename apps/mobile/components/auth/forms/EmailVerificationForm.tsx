import { Pressable, StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import Typography from '../../common/typography/Typography';
import colors from '../../../lib/constants/colors';
import { EmailVerificationType, sendEmailCode, verifyEmailCode } from '../../../lib/apis/auth';
import Button from '../../common/button/Button';
import CodeInput from '../code-input/CodeInput';

interface EmailVerificationFormProps {
  type: EmailVerificationType;
  email: string;
  setEmail: (email: string) => void;
  code: string;
  setCode: (code: string) => void;
  setVerificationToken: (verificationToken: string) => void;
  setStep: (step: 'email' | 'password') => void;
}

function EmailVerificationForm({
  type,
  email,
  setEmail,
  code,
  setCode,
  setVerificationToken,
  setStep,
}: EmailVerificationFormProps) {
  const { mutate: sendCode, isPending: isSendingCode } = useMutation({
    mutationFn: () => sendEmailCode(email.trim(), type),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: '코드가 재발송되었습니다.',
      });
    },
  });

  const { mutate: verifyCode, isPending: isVerifyingCode } = useMutation({
    mutationFn: () => verifyEmailCode(email, code, type),
    onSuccess: (data) => {
      setVerificationToken(data.verificationToken);
      setStep('password');
    },
  });

  function handleVerifyCode() {
    if (isVerifyingCode) return;
    verifyCode();
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.codeInputContainer}>
          <View style={styles.titleContainer}>
            <Typography.Display>코드 입력</Typography.Display>
            <Typography.BodyBase>
              <Typography.BodyBase color={colors.forest900}>{email}</Typography.BodyBase>로 {'\n'}발송된 6자리 인증
              코드를 입력해주세요.
            </Typography.BodyBase>
          </View>

          <CodeInput value={code} onChange={setCode} />
        </View>
        <View style={styles.buttonContainer}>
          <View style={styles.resendCodeContainer}>
            <Typography.BodyBase color={colors.stone500}>코드를 못 받으셨나요?</Typography.BodyBase>
            <Pressable
              onPress={() => {
                sendCode();
              }}
              disabled={isSendingCode}
            >
              <Typography.BodyBase color={colors.forest700}>코드 재발송</Typography.BodyBase>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              setStep('email');
              setEmail('');
            }}
          >
            <Typography.BodyMedium color={colors.stone500} style={{ textDecorationLine: 'underline' }}>
              이메일 주소 변경
            </Typography.BodyMedium>
          </Pressable>
        </View>
      </View>

      <Button onPress={handleVerifyCode} disabled={!code || isVerifyingCode} loading={isVerifyingCode} fullWidth>
        인증 확인
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
    gap: 16,
  },
  codeInputContainer: {
    gap: 32,
  },
  titleContainer: {
    gap: 8,
  },
  resendCodeContainer: {
    flexDirection: 'row',

    alignItems: 'center',
    gap: 4,
  },
  buttonContainer: {
    gap: 8,
  },
});

export default EmailVerificationForm;
