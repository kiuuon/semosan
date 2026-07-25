import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Header from '../../components/common/header/Header';
import colors from '../../lib/constants/colors';
import Typography from '../../components/common/typography/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../../lib/apis/auth';
import useRequireAuth from '../../lib/hooks/useRequireAuth';

const SettingsScreen = () => {
  const queryClient = useQueryClient();
  const { navigateWithAuth } = useRequireAuth();

  const { mutate, isPending } = useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ['me'] });
      router.back();
    },
  });

  return (
    <>
      <Header title="설정" />
      <View style={styles.container}>
        <View style={styles.listContainer}>
          <TouchableOpacity
            style={[styles.listItem, { borderBottomWidth: 1, borderBottomColor: colors.stone100 }]}
            onPress={() => {
              navigateWithAuth('/edit-my-info');
            }}
          >
            <Typography.BodyBase>회원정보 수정</Typography.BodyBase>
            <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
          </TouchableOpacity>
          <View style={[styles.listItem]}>
            <Typography.BodyBase>푸시 알림</Typography.BodyBase>
            <Switch />
          </View>
          <TouchableOpacity style={[styles.listItem]} onPress={() => {}}>
            <Typography.BodyBase>문의 하기</Typography.BodyBase>
            <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.listItem, { borderBottomWidth: 1, borderBottomColor: colors.stone100 }]}
            onPress={() => {}}
          >
            <Typography.BodyBase>개인정보 보호</Typography.BodyBase>
            <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
          </TouchableOpacity>
        </View>
        <View style={styles.extraContainer}>
          <TouchableOpacity onPress={() => mutate()} disabled={isPending}>
            <Typography.BodyMedium>로그아웃</Typography.BodyMedium>
          </TouchableOpacity>
          {/* TODO: develop version function later */}
          <Typography.BodyMedium color={colors.stone500}>{`v1.0.0 · 최신버전`}</Typography.BodyMedium>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContainer: {},
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  extraContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: colors.stone100,
    paddingVertical: 32,
    gap: 32,
  },
});

export default SettingsScreen;
