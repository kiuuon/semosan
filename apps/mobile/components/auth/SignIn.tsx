import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { authStyles as styles } from './styles';

type SignInProps = {
  onSwitchToSignUp: () => void;
};

export function SignIn({ onSwitchToSignUp }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleLogin() {
    if (!canSubmit || loading) return;

    setError(null);
    setLoading(true);

    try {
      // TODO: 서버 인증 API 연동
      await new Promise((resolve) => setTimeout(resolve, 400));
      router.replace('/(tabs)/home');
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!canSubmit || loading) && styles.buttonDisabled,
            pressed && canSubmit && !loading && styles.buttonPressed,
          ]}
          onPress={handleLogin}
          disabled={!canSubmit || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>로그인</Text>}
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
