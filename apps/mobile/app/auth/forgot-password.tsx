import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ForgotPassword } from '../../components/auth/ForgotPassword/ForgotPassword';
import { AuthHeader } from '../../components/auth/AuthHeader/AuthHeader';

export default function ForgotPasswordScreen() {
  return (
    <View style={styles.container}>
      <AuthHeader title="비밀번호 찾기" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ForgotPassword />
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
