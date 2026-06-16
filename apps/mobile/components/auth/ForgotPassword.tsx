import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { authStyles as styles } from './styles';

export function ForgotPassword() {
  const [email, setEmail] = useState('');

  const canSubmit = email.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;

    Alert.alert('준비중', '비밀번호 재설정 메일 발송은 서버 기능 연결 후 제공될 예정입니다.');
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitle}>가입한 이메일로 비밀번호 재설정 안내를 보내드립니다</Text>

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
          onSubmitEditing={handleSubmit}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>비밀번호 재설정 메일 보내기</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
