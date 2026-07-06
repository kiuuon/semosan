import { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { resetPassword, sendEmailCode, verifyEmailCode } from '../../../lib/apis/auth';
import { authStyles as styles } from '../styles';

type ForgotPasswordStep = 'email' | 'code' | 'password';

export function ForgotPassword() {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const passwordsMatch = password === passwordConfirm;

  const canSendCode = email.trim().length > 0;
  const canVerifyCode = code.length === 6;
  const canResetPassword = password.length >= 8 && passwordConfirm.length > 0 && passwordsMatch && !!verificationToken;

  const { mutate: sendCode, isPending: isSendingCode } = useMutation({
    mutationFn: () => sendEmailCode(email, 'PASSWORD_RESET'),
    onSuccess: () => {
      setStep('code');
      Alert.alert('인증 코드를 발송했습니다.', '메일함에서 6자리 코드를 확인해 주세요.');
    },
  });

  const { mutate: verifyCodeMutate, isPending: isVerifyingCode } = useMutation({
    mutationFn: () => verifyEmailCode(email, code, 'PASSWORD_RESET'),
    onSuccess: (data) => {
      Keyboard.dismiss();
      setCode('');
      setVerificationToken(data.verificationToken);
      setStep('password');
    },
  });

  const { mutate: resetPasswordMutate, isPending: isResettingPassword } = useMutation({
    mutationFn: () => {
      if (!verificationToken) {
        throw new Error('이메일 인증이 필요합니다.');
      }

      return resetPassword(email, verificationToken, password);
    },
    onSuccess: () => {
      Alert.alert('완료', '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
      router.back();
    },
  });

  function handleSendCode() {
    if (!canSendCode || isSendingCode) return;
    sendCode();
  }

  function handleVerifyCode() {
    if (!canVerifyCode || isVerifyingCode) return;
    Keyboard.dismiss();
    verifyCodeMutate();
  }

  function handleResetPassword() {
    if (!canResetPassword || isResettingPassword) return;
    resetPasswordMutate();
  }

  return (
    <ScrollView
      key={step}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {step === 'email' ? (
        <>
          <Text style={styles.subtitle}>가입한 이메일로 비밀번호 재설정 인증 코드를 보내드립니다</Text>

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
              returnKeyType="done"
              onSubmitEditing={handleSendCode}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!canSendCode || isSendingCode) && styles.buttonDisabled,
                pressed && canSendCode && !isSendingCode && styles.buttonPressed,
              ]}
              onPress={handleSendCode}
              disabled={!canSendCode || isSendingCode}
            >
              {isSendingCode ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>인증 코드 보내기</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 'code' ? (
        <>
          <Text style={styles.subtitle}>메일함에서 6자리 인증 코드를 확인해 주세요</Text>

          <View style={styles.form}>
            <Text style={styles.label}>이메일</Text>
            <Text style={styles.verifiedEmail}>{email.trim()}</Text>

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

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handleSendCode}
              disabled={isSendingCode}
            >
              {isSendingCode ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.secondaryButtonText}>인증 코드 재발송</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 'password' ? (
        <>
          <Text style={styles.subtitle}>새 비밀번호를 설정해 주세요</Text>

          <View style={styles.form}>
            <Text style={styles.label}>이메일</Text>
            <Text style={styles.verifiedEmail}>{email.trim()}</Text>

            <Text style={styles.label}>새 비밀번호</Text>
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

            <Text style={styles.label}>새 비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호 다시 입력"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />

            {passwordConfirm.length > 0 && !passwordsMatch ? (
              <Text style={styles.error}>비밀번호가 일치하지 않습니다.</Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!canResetPassword || isResettingPassword) && styles.buttonDisabled,
                pressed && canResetPassword && !isResettingPassword && styles.buttonPressed,
              ]}
              onPress={handleResetPassword}
              disabled={!canResetPassword || isResettingPassword}
            >
              {isResettingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>비밀번호 변경</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
