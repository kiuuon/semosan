import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { sendEmailCode, signUp, verifyEmailCode } from '../../lib/apis/auth';
import { authStyles as styles } from './styles';

type SignUpProps = {
  onSwitchToSignIn: () => void;
};

type SignUpStep = 'email' | 'password';

export function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const [step, setStep] = useState<SignUpStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const { mutate: sendCode, isPending: isSendingCode } = useMutation({
    mutationFn: () => sendEmailCode(email),
    onSuccess: () => {
      setCodeSent(true);
      Alert.alert('인증 코드를 발송했습니다.', '메일함에서 6자리 코드를 확인해 주세요.');
    },
    onError: (error) => {
      Alert.alert('발송 실패', error instanceof Error ? error.message : '인증 코드 발송에 실패했습니다.');
    },
  });

  const { mutate: verifyCode, isPending: isVerifyingCode } = useMutation({
    mutationFn: () => verifyEmailCode(email, code),
    onSuccess: (data) => {
      setVerificationToken(data.verificationToken);
      setStep('password');
    },
    onError: (error) => {
      Alert.alert('인증 실패', error instanceof Error ? error.message : '이메일 인증에 실패했습니다.');
    },
  });

  const { mutate: register, isPending: isRegistering } = useMutation({
    mutationFn: () => {
      if (!verificationToken) {
        throw new Error('이메일 인증이 필요합니다.');
      }

      return signUp(email, password, verificationToken);
    },
    onSuccess: () => {
      router.replace('/(tabs)/home');
    },
    onError: (error) => {
      Alert.alert('회원가입 실패', error instanceof Error ? error.message : '회원가입에 실패했습니다.');
    },
  });

  const passwordsMatch = password === passwordConfirm;
  const canSendCode = email.trim().length > 0;
  const canVerifyCode = codeSent && code.length === 6;
  const canSubmitPassword = password.length >= 8 && passwordConfirm.length > 0 && passwordsMatch && !!verificationToken;

  function handleSendCode() {
    if (!canSendCode || isSendingCode) return;
    sendCode();
  }

  function handleVerifyCode() {
    if (!canVerifyCode || isVerifyingCode) return;
    verifyCode();
  }

  function handleSignup() {
    if (!canSubmitPassword || isRegistering) return;
    register();
  }

  if (step === 'email') {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>이메일 인증 후 계정을 만드세요</Text>

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
            editable={!codeSent}
          />

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              (!canSendCode || isSendingCode) && styles.buttonDisabled,
              pressed && canSendCode && !isSendingCode && styles.buttonPressed,
            ]}
            onPress={handleSendCode}
            disabled={!canSendCode || isSendingCode}
          >
            {isSendingCode ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.secondaryButtonText}>{codeSent ? '인증 코드 재발송' : '인증 코드 받기'}</Text>
            )}
          </Pressable>

          {codeSent ? (
            <>
              <Text style={styles.label}>인증 코드</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="6자리 코드"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyCode}
              />
            </>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (!canVerifyCode || isVerifyingCode) && styles.buttonDisabled,
              pressed && canVerifyCode && !isVerifyingCode && styles.buttonPressed,
            ]}
            onPress={handleVerifyCode}
            disabled={!canVerifyCode || isVerifyingCode}
          >
            {isVerifyingCode ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>다음</Text>}
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

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitle}>비밀번호를 설정하세요</Text>

      <View style={styles.form}>
        <Text style={styles.label}>이메일</Text>
        <Text style={styles.verifiedEmail}>{email.trim()}</Text>

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
            (!canSubmitPassword || isRegistering) && styles.buttonDisabled,
            pressed && canSubmitPassword && !isRegistering && styles.buttonPressed,
          ]}
          onPress={handleSignup}
          disabled={!canSubmitPassword || isRegistering}
        >
          {isRegistering ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>회원가입</Text>}
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
