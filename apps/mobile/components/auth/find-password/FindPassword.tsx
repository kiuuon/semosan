import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../../lib/constants/colors';
import ProgressBar from '../../common/progress-bar/ProgressBar';
import EmailForm from '../forms/EmailForm';
import EmailVerificationForm from '../forms/EmailVerificationForm';
import PasswordForm from '../forms/PasswordForm';

type FindPasswordStep = 'email' | 'email-verification' | 'password';

interface FindPasswordProps {
  onSuccess: () => void;
}

function FindPassword({ onSuccess }: FindPasswordProps) {
  const [step, setStep] = useState<FindPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  function handleComplete() {
    Toast.show({
      type: 'success',
      text1: '비밀번호가 변경되었습니다.',
      text2: '새 비밀번호로 로그인해 주세요.',
    });
    onSuccess();
  }

  return (
    <View style={styles.container}>
      <ProgressBar
        totalSteps={3}
        currentStep={step === 'email' ? 1 : step === 'email-verification' ? 2 : 3}
        currentStepName={
          step === 'email' ? '이메일 인증' : step === 'email-verification' ? '코드 확인' : '비밀번호 설정'
        }
      />

      <View style={styles.iconContainer}>
        {step === 'email' && <Ionicons name="mail-outline" size={22} color={colors.forest900} />}
        {step === 'email-verification' && <Ionicons name="key-outline" size={22} color={colors.forest900} />}
        {step === 'password' && <Ionicons name="lock-closed-outline" size={22} color={colors.forest900} />}
      </View>

      {step === 'email' ? (
        <EmailForm type="PASSWORD_RESET" email={email} setEmail={setEmail} setStep={setStep} />
      ) : null}
      {step === 'email-verification' ? (
        <EmailVerificationForm
          type="PASSWORD_RESET"
          email={email}
          setEmail={setEmail}
          code={code}
          setCode={setCode}
          setVerificationToken={setVerificationToken}
          setStep={setStep}
        />
      ) : null}
      {step === 'password' ? (
        <PasswordForm
          type="PASSWORD_RESET"
          email={email}
          verificationToken={verificationToken}
          onComplete={handleComplete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.forest100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
});

export default FindPassword;
