import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import Typography from '../../common/Typography/Typography';
import { signUp } from '../../../lib/apis/auth';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import PasswordRequirements from '../PasswordRequirements/PasswordRequirements';

interface PasswordFormProps {
  email: string;
  verificationToken: string | null;
}

function PasswordForm({ email, verificationToken }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const { mutate: register, isPending: isRegistering } = useMutation({
    mutationFn: () => signUp(email, password, verificationToken as string),
    onSuccess: () => {
      router.replace('/(tabs)/home');
    },
  });

  function handleSignUp() {
    if (!verificationToken) {
      Toast.show({
        type: 'error',
        text1: '이메일 인증이 필요합니다.',
      });
      return;
    }

    if (isRegistering) return;
    register();
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Typography.Display>비밀번호 설정</Typography.Display>
          <Typography.BodyBase>세모산에서 사용할 비밀번호를 설정해주세요.</Typography.BodyBase>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <Input
              value={password}
              onChangeText={setPassword}
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
            />
            {password.length > 0 && (
              <PasswordRequirements hasMinLength={hasMinLength} hasLetter={hasLetter} hasNumber={hasNumber} />
            )}
          </View>
          <Input
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            label="비밀번호 확인"
            placeholder="비밀번호를 한 번 더 입력하세요"
            secureTextEntry
            status={password !== passwordConfirm && passwordConfirm.length > 0 ? 'error' : 'default'}
            caption={
              password !== passwordConfirm && passwordConfirm.length > 0 ? '비밀번호가 일치하지 않습니다.' : undefined
            }
          />
        </View>
      </View>

      <Button
        onPress={handleSignUp}
        disabled={isRegistering || !hasMinLength || !hasLetter || !hasNumber || password !== passwordConfirm}
        loading={isRegistering}
        fullWidth
      >
        회원가입 완료
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
  inputContainer: {
    gap: 16,
  },
  passwordContainer: {
    gap: 8,
  },
});

export default PasswordForm;
