import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { SignIn } from '../../components/auth/SignIn';
import { SignUp } from '../../components/auth/SignUp';

type AuthMode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');

  const isSignUp = mode === 'signUp';

  function handleBack() {
    if (isSignUp) {
      setMode('signIn');
      return;
    }

    if (router.canGoBack()) {
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      <AuthHeader title={isSignUp ? '회원가입' : '로그인'} onBack={handleBack} />

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isSignUp ? (
          <SignUp onSwitchToSignIn={() => setMode('signIn')} />
        ) : (
          <SignIn onSwitchToSignUp={() => setMode('signUp')} />
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
