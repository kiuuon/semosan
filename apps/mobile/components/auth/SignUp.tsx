import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { signUp } from '../../lib/apis/auth';
import { authStyles as styles } from './styles';

type SignUpProps = {
  onSwitchToSignIn: () => void;
};

export function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signUp(email, password),
    onSuccess: () => {
      router.replace('/(tabs)/home');
    },
    onError: (error) => {
      console.error(error);
      Alert.alert('회원가입에 실패했습니다. 다시 시도해 주세요.');
    },
  });

  const passwordsMatch = password === passwordConfirm;
  const canSubmit = email.trim().length > 0 && password.length >= 8 && passwordConfirm.length > 0 && passwordsMatch;

  function handleSignup() {
    if (!canSubmit || isPending) return;

    mutate({ email: email.trim(), password });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitle}>새 계정을 만드세요</Text>

      <View style={styles.form}>
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="next"
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="8자 이상"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          textContentType="newPassword"
          returnKeyType="next"
        />

        <Text style={styles.label}>비밀번호 확인</Text>
        <TextInput
          style={styles.input}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="비밀번호 다시 입력"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSignup}
        />

        {passwordConfirm.length > 0 && !passwordsMatch ? (
          <Text style={styles.error}>비밀번호가 일치하지 않습니다.</Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!canSubmit || isPending) && styles.buttonDisabled,
            pressed && canSubmit && !isPending && styles.buttonPressed,
          ]}
          onPress={handleSignup}
          disabled={!canSubmit || isPending}
        >
          {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>회원가입</Text>}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>이미 계정이 있으신가요?</Text>
        <Pressable onPress={onSwitchToSignIn} hitSlop={8}>
          <Text style={styles.footerLink}>로그인</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
