import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../../lib/constants/colors';
import ProgressBar from '../../common/ProgressBar/ProgressBar';
import EmailForm from './EmailForm';
import EmailVerificationForm from './EmailVerificationForm';
import PasswordForm from './PasswordForm';

type SignUpStep = 'email' | 'email-verification' | 'password';

function SignUp() {
  const [step, setStep] = useState<SignUpStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

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

      {step === 'email' ? <EmailForm email={email} setEmail={setEmail} setStep={setStep} /> : null}
      {step === 'email-verification' ? (
        <EmailVerificationForm
          email={email}
          setEmail={setEmail}
          code={code}
          setCode={setCode}
          setVerificationToken={setVerificationToken}
          setStep={setStep}
        />
      ) : null}
      {step === 'password' ? <PasswordForm email={email} verificationToken={verificationToken} /> : null}
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

export default SignUp;
