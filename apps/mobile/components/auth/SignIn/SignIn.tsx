import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { login } from '../../../lib/apis/auth';
import colors from '../../../lib/constants/colors';
import Typography from '../../common/Typography/Typography';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';

interface SignInProps {
  onSwitchToSignUp: () => void;
}

function SignIn({ onSwitchToSignUp }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => {
      router.replace('/(tabs)/home');
    },
  });

  const canSubmit = email.trim().length > 0 && password.length > 0;

  function handleLogin() {
    if (!canSubmit || isPending) return;

    mutate({ email: email.trim(), password });
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Typography.Display color={colors.forest900}>세모산</Typography.Display>
        <Typography.BodyBase color={colors.stone500}>산을 오르는 모든 순간을 함께</Typography.BodyBase>
      </View>

      <View style={styles.form}>
        <View style={styles.inputBlock}>
          <Input label="이메일" placeholder="example@email.com" value={email} onChangeText={setEmail} />
          <Input
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button onPress={handleLogin} disabled={!canSubmit || isPending} loading={isPending} fullWidth>
          로그인
        </Button>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={onSwitchToSignUp} hitSlop={8}>
          <Typography.BodyMedium color={colors.forest900}>회원가입</Typography.BodyMedium>
        </TouchableOpacity>
        <View style={styles.footerSeparator} />
        <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} hitSlop={8}>
          <Typography.BodyBase color={colors.stone500}>비밀번호 찾기</Typography.BodyBase>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 32,
  },
  titleBlock: {
    gap: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  form: {
    gap: 28,
  },
  inputBlock: {
    gap: 20,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSeparator: {
    width: 1,
    height: 12,
    backgroundColor: colors.stone300,
  },
});

export default SignIn;
