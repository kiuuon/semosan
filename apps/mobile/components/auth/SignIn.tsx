import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { login } from '../../lib/apis/auth';
import { authStyles as styles } from './styles';

type SignInProps = {
  onSwitchToSignUp: () => void;
};

export function SignIn({ onSwitchToSignUp }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => {
      router.replace('/(tabs)/home');
    },
    onError: () => {
      Alert.alert('로그인에 실패했습니다. 다시 시도해 주세요.');
    },
  });

  const canSubmit = email.trim().length > 0 && password.length > 0;

  function handleLogin() {
    if (!canSubmit || isPending) return;

    mutate({ email: email.trim(), password });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitle}>계정으로 로그인하세요</Text>

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
          placeholder="비밀번호 입력"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!canSubmit || isPending) && styles.buttonDisabled,
            pressed && canSubmit && !isPending && styles.buttonPressed,
          ]}
          onPress={handleLogin}
          disabled={!canSubmit || isPending}
        >
          {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>로그인</Text>}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>계정이 없으신가요?</Text>
        <Pressable onPress={onSwitchToSignUp} hitSlop={8}>
          <Text style={styles.footerLink}>회원가입</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
