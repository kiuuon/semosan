import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import DismissKeyboard from '../../components/common/dismiss-keyboard/DismissKeyboard';
import AppKeyboardAvoidingView from '../../components/common/keyboard-avoiding/AppKeyboardAvoidingView';
import Header from '../../components/common/header/Header';
import Input from '../../components/common/input/Input';
import Button from '../../components/common/button/Button';
import Typography from '../../components/common/typography/Typography';
import { joinTripByInviteCode } from '../../lib/apis/trips';
import colors from '../../lib/constants/colors';

const InviteCodeScreen = () => {
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => joinTripByInviteCode(inviteCode),
    onSuccess: async (trip) => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.setQueryData(['trip', trip._id], trip);
      Toast.show({ type: 'success', text1: '일정에 참여했습니다.' });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace(`/trip/${trip._id}`);
    },
  });

  const canSubmit = inviteCode.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    mutate();
  }

  return (
    <View style={styles.root}>
      <Header title="초대코드 입력" />
      <AppKeyboardAvoidingView style={styles.flex}>
        <DismissKeyboard>
          <View style={styles.container}>
            <Typography.BodyBase color={colors.stone500}>
              전달받은 초대코드를 입력해주세요. 확인을 누르면 해당 일정에 바로 참여됩니다.
            </Typography.BodyBase>
            <View style={styles.inputContainer}>
              <Input
                placeholder="초대코드를 입력해주세요."
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                autoFocus
              />
            </View>
            <Button size="md" fullWidth disabled={!canSubmit} loading={isPending} onPress={handleSubmit}>
              확인
            </Button>
          </View>
        </DismissKeyboard>
      </AppKeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  inputContainer: {
    marginVertical: 16,
  },
});

export default InviteCodeScreen;
