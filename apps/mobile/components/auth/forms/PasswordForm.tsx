import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Typography from '../../common/typography/Typography';
import { EmailVerificationType, resetPassword, signUp } from '../../../lib/apis/auth';
import colors from '../../../lib/constants/colors';
import Button from '../../common/button/Button';
import Input from '../../common/input/Input';
import PasswordRequirements from '../password-requirements/PasswordRequirements';

const FORM_COPY: Record<EmailVerificationType, { title: string; description: string; submit: string }> = {
  SIGNUP: {
    title: '비밀번호 설정',
    description: '세모산에서 사용할 비밀번호를 설정해주세요.',
    submit: '회원가입 완료',
  },
  PASSWORD_RESET: {
    title: '새 비밀번호',
    description: '새롭게 사용할 비밀번호를 입력해주세요.',
    submit: '비밀번호 변경 완료',
  },
};

interface PasswordFormProps {
  type: EmailVerificationType;
  email: string;
  verificationToken: string | null;
  onComplete: () => void;
}

function ConsentRow({
  checked,
  onToggle,
  label,
  linkLabel,
  onPressLink,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  linkLabel?: string;
  onPressLink?: () => void;
}) {
  return (
    <View style={styles.consentRow}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        style={styles.consentCheck}
      >
        <Ionicons
          name={checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={checked ? colors.forest700 : colors.stone300}
        />
        <Typography.BodyBase color={colors.stone700} style={styles.consentLabel}>
          {label}
        </Typography.BodyBase>
      </Pressable>
      {linkLabel && onPressLink ? (
        <Pressable onPress={onPressLink} hitSlop={8} accessibilityRole="link">
          <Typography.Caption color={colors.stone500} style={styles.consentLink}>
            {linkLabel}
          </Typography.Caption>
        </Pressable>
      ) : null}
    </View>
  );
}

function PasswordForm({ type, email, verificationToken, onComplete }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const copy = FORM_COPY[type];
  const isSignup = type === 'SIGNUP';

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const agreedAll = agreedTerms && agreedPrivacy;

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (type === 'SIGNUP') {
        await signUp(email, password, verificationToken as string);
        return;
      }

      await resetPassword(email, verificationToken as string, password);
    },
    onSuccess: () => {
      onComplete();
    },
  });

  function handleToggleAll() {
    const next = !(agreedTerms && agreedPrivacy);
    setAgreedTerms(next);
    setAgreedPrivacy(next);
  }

  function handleSubmit() {
    if (!verificationToken) {
      Toast.show({
        type: 'error',
        text1: '이메일 인증이 필요합니다.',
      });
      return;
    }

    if (isSignup && !agreedAll) {
      Toast.show({
        type: 'error',
        text1: '필수 약관에 동의해 주세요.',
      });
      return;
    }

    if (isSubmitting) return;
    submit();
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Typography.Display>{copy.title}</Typography.Display>
          <Typography.BodyBase>{copy.description}</Typography.BodyBase>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <Input
              value={password}
              onChangeText={setPassword}
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
            />
            {password.length > 0 && (
              <PasswordRequirements hasMinLength={hasMinLength} hasLetter={hasLetter} hasNumber={hasNumber} />
            )}
          </View>
          <Input
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            label="비밀번호 확인"
            placeholder="비밀번호를 한 번 더 입력하세요"
            secureTextEntry
            status={password !== passwordConfirm && passwordConfirm.length > 0 ? 'error' : 'default'}
            caption={
              password !== passwordConfirm && passwordConfirm.length > 0 ? '비밀번호가 일치하지 않습니다.' : undefined
            }
          />
        </View>

        {isSignup ? (
          <View style={styles.consentContainer}>
            <ConsentRow checked={agreedAll} onToggle={handleToggleAll} label="전체 동의" />
            <View style={styles.consentDivider} />
            <ConsentRow
              checked={agreedTerms}
              onToggle={() => setAgreedTerms((prev) => !prev)}
              label="[필수] 서비스 이용약관 동의"
              linkLabel="보기"
              onPressLink={() => router.push('/terms')}
            />
            <ConsentRow
              checked={agreedPrivacy}
              onToggle={() => setAgreedPrivacy((prev) => !prev)}
              label="[필수] 개인정보처리방침 동의"
              linkLabel="보기"
              onPressLink={() => router.push('/privacy')}
            />
          </View>
        ) : null}
      </View>

      <Button
        onPress={handleSubmit}
        disabled={
          isSubmitting ||
          !hasMinLength ||
          !hasLetter ||
          !hasNumber ||
          password !== passwordConfirm ||
          (isSignup && !agreedAll)
        }
        loading={isSubmitting}
        fullWidth
      >
        {copy.submit}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    gap: 32,
  },
  titleContainer: {
    gap: 8,
  },
  inputContainer: {
    gap: 16,
  },
  passwordContainer: {
    gap: 8,
  },
  consentContainer: {
    gap: 12,
  },
  consentDivider: {
    height: 1,
    backgroundColor: colors.stone100,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  consentCheck: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  consentLabel: {
    flex: 1,
  },
  consentLink: {
    textDecorationLine: 'underline',
  },
});

export default PasswordForm;
