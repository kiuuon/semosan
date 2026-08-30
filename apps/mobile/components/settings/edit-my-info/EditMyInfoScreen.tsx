import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import DismissKeyboard from '../../common/dismiss-keyboard/DismissKeyboard';
import AppKeyboardAvoidingView from '../../common/keyboard-avoiding/AppKeyboardAvoidingView';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import Divider from '../../common/divider/Divider';
import Button from '../../common/button/Button';
import Input from '../../common/input/Input';
import PasswordRequirements from '../../auth/password-requirements/PasswordRequirements';
import Typography from '../../common/typography/Typography';
import colors from '../../../lib/constants/colors';
import { changePassword, deleteAccount, getMe, logout, updateNickname } from '../../../lib/apis/auth';

const EditMyInfoScreen = () => {
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });

  const [isVisibleEditField, setIsVisibleEditField] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>('');

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isPasswordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;

  const { mutate: mutateNickname, isPending: isNicknamePending } = useMutation({
    mutationFn: () => updateNickname(nickname),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsVisibleEditField(false);
      setNickname('');
      Toast.show({ type: 'success', text1: '닉네임이 변경되었습니다.' });
    },
  });

  const { mutate: mutatePassword, isPending: isPasswordPending } = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: async () => {
      await logout();
      await queryClient.removeQueries({ queryKey: ['me'] });
      Toast.show({ type: 'success', text1: '비밀번호가 변경되었습니다. 다시 로그인해 주세요.' });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    },
  });

  const isActiveNicknameButton = !!nickname.trim() && !isNicknamePending;
  const isActivePasswordButton =
    !!currentPassword && hasMinLength && hasLetter && hasNumber && !isPasswordMismatch && !isPasswordPending;

  const onPressEditNickname = () => {
    if (!isActiveNicknameButton) return;
    mutateNickname();
  };

  const onPressChangePassword = () => {
    if (!isActivePasswordButton) return;
    mutatePassword();
  };

  const { mutate: mutateDeleteAccount, isPending: isDeletePending } = useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ['me'] });
      Toast.show({ type: 'success', text1: '회원 탈퇴가 완료되었습니다.' });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    },
  });

  const onPressDeleteButton = () => {
    if (isDeletePending) return;

    Alert.alert(
      '회원 탈퇴',
      '정말 회원 탈퇴하시겠습니까? 탈퇴를 진행하시면 더이상 세모산 서비스 이용이 불가능합니다.',
      [
        { text: '취소' },
        {
          text: '확인',
          style: 'destructive',
          onPress: () => mutateDeleteAccount(),
        },
      ],
    );
  };

  return (
    <AppKeyboardAvoidingView style={styles.flex}>
      <DismissKeyboard>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.subContainer}>
            <View style={styles.title}>
              <Typography.HeadingMd>기본 정보</Typography.HeadingMd>
            </View>
            <Divider />
            <View style={styles.infoContainer}>
              <View style={styles.infoTitle}>
                <Typography.HeadingMd>닉네임</Typography.HeadingMd>
              </View>
              <View style={styles.infoData}>
                <Typography.BodyBase>{me?.nickname}</Typography.BodyBase>
              </View>
              <Button variant="outline" size="sm" onPress={() => setIsVisibleEditField((prev) => !prev)}>
                {isVisibleEditField ? '취소' : '수정'}
              </Button>
            </View>
            {isVisibleEditField && (
              <View style={styles.editNameContainer}>
                <Input value={nickname} placeholder="변경할 닉네임을 입력하세요" onChangeText={setNickname} />
                <Button
                  onPress={onPressEditNickname}
                  disabled={!isActiveNicknameButton}
                  loading={isNicknamePending}
                  fullWidth
                >
                  변경하기
                </Button>
              </View>
            )}
            <View style={styles.infoContainer}>
              <View style={styles.infoTitle}>
                <Typography.HeadingMd>
                  {'이메일'}
                  {'\n'}
                  {'(아이디)'}
                </Typography.HeadingMd>
              </View>
              <View style={styles.infoData}>
                <Typography.BodyBase>{me?.email}</Typography.BodyBase>
              </View>
            </View>
            <View style={styles.captionContainer}>
              <Typography.Caption color={colors.stone500}>문의사항은 관리자에게 문의해주세요.</Typography.Caption>
            </View>
          </View>

          <View style={styles.subContainer}>
            <View style={styles.title}>
              <Typography.HeadingMd>비밀번호 변경</Typography.HeadingMd>
            </View>
            <Divider />
            <View style={styles.inputContainer}>
              <Input
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="현재 비밀번호를 입력하세요"
                secureTextEntry
              />
              <Input
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="새 비밀번호를 입력하세요"
                secureTextEntry
              />
              {newPassword.length > 0 && (
                <PasswordRequirements hasMinLength={hasMinLength} hasLetter={hasLetter} hasNumber={hasNumber} />
              )}
              <Input
                value={newPasswordConfirm}
                onChangeText={setNewPasswordConfirm}
                placeholder="비밀번호를 한 번 더 입력하세요"
                secureTextEntry
                status={isPasswordMismatch ? 'error' : 'default'}
                caption={isPasswordMismatch ? '비밀번호가 일치하지 않습니다.' : undefined}
              />
              <Button
                onPress={onPressChangePassword}
                disabled={!isActivePasswordButton}
                loading={isPasswordPending}
                fullWidth
              >
                비밀번호 변경
              </Button>
            </View>
          </View>

          <View style={styles.subContainer}>
            <View style={styles.title}>
              <Typography.HeadingMd>회원 탈퇴</Typography.HeadingMd>
            </View>
            <Divider />
            <TouchableWithoutFeedback onPress={onPressDeleteButton}>
              <View style={styles.withDrawText}>
                <Typography.Caption style={{ textDecorationLine: 'underline' }}>회원 탈퇴하기</Typography.Caption>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </DismissKeyboard>
    </AppKeyboardAvoidingView>
  );
};

export default EditMyInfoScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    padding: 16,
  },
  subContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.stone900,
    marginBottom: 20,
  },
  title: {
    padding: 16,
  },
  editNameContainer: {
    gap: 8,
    marginLeft: 96,
    marginRight: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  infoTitle: {
    width: 80,
  },
  infoData: {
    flexGrow: 1,
  },
  inputContainer: {
    padding: 16,
    gap: 10,
  },
  captionContainer: {
    paddingHorizontal: 16,
  },
  withDrawText: {
    padding: 16,
    marginBottom: 80,
  },
});
