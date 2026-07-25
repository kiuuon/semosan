import { useState } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import Input from '../../common/input/Input';
import Button from '../../common/button/Button';
import colors from '../../../lib/constants/colors';
import { verifyPassword } from '../../../lib/apis/auth';

interface VerifyPasswordScreenProps {
  setVerified: (value: boolean) => void;
}

const VerifyPasswordScreen = ({ setVerified }: VerifyPasswordScreenProps) => {
  const [password, setPassword] = useState<string>('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => verifyPassword(password),
    onSuccess: () => {
      setVerified(true);
    },
  });

  const isActiveButton = !!password && !isPending;

  const onPressButton = () => {
    if (!isActiveButton) return;
    mutate();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Input
            value={password}
            onChangeText={setPassword}
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            secureTextEntry
            caption="안전한 회원정보 수정을 위해 비밀번호를 입력해주세요"
          />
        </View>
        <Button disabled={!isActiveButton} loading={isPending} onPress={onPressButton} fullWidth>
          다음
        </Button>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default VerifyPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
  },
  inputContainer: {
    flex: 1,
  },
});
