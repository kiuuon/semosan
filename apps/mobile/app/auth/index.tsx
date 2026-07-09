import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import Header from '../../components/common/header/Header';
import SignIn from '../../components/auth/sign-in/SignIn';
import SignUp from '../../components/auth/sign-up/SignUp';
import FindPassword from '../../components/auth/find-password/FindPassword';

type AuthMode = 'signIn' | 'signUp' | 'findPassword';

const TITLES: Record<AuthMode, string> = {
  signIn: '로그인',
  signUp: '회원가입',
  findPassword: '비밀번호 찾기',
};

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');

  function handleBack() {
    if (mode !== 'signIn') {
      setMode('signIn');
    } else if (router.canGoBack()) {
      router.back();
    }
  }
  return (
    <View style={styles.container}>
      <Header title={TITLES[mode]} onBack={handleBack} />

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {mode === 'signUp' ? (
          <SignUp />
        ) : mode === 'findPassword' ? (
          <FindPassword onSuccess={() => setMode('signIn')} />
        ) : (
          <SignIn onSwitchToSignUp={() => setMode('signUp')} onSwitchToFindPassword={() => setMode('findPassword')} />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  body: {
    flex: 1,
  },
});
