import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import colors from '../../../lib/constants/colors';
import useAuth from '../../../lib/hooks/useAuth';
import { getMe } from '../../../lib/apis/auth';
import Typography from '../../../components/common/typography/Typography';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function MyScreen() {
  const { accessToken } = useAuth();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!accessToken,
  });

  if (!accessToken) {
    return (
      <View style={styles.container}>
        <View style={styles.loginSection}>
          <View>
            <TouchableOpacity onPress={() => router.push('/auth')} style={styles.loginButton}>
              <Typography.HeadingLg>로그인 · 회원가입</Typography.HeadingLg>
              <Ionicons name="chevron-forward" size={18} color={colors.stone300} />
            </TouchableOpacity>
            <Typography.Caption color={colors.stone500}>{`로그인하고 나만의 산행을 기록해 보세요.`}</Typography.Caption>
          </View>
          <TouchableOpacity style={styles.settingsButtonWrapper} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingSection}>
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <MaterialCommunityIcons name="hiking" size={32} color={colors.stone300} />
          </View>
          <View style={styles.profileInfo}>
            <Typography.HeadingMd>{user?.nickname}</Typography.HeadingMd>
            <Typography.Caption color={colors.stone700}>{user?.email}</Typography.Caption>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButtonWrapper} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headingSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    // backgroundColor: colors.forest50,
    borderBottomWidth: 10,
    borderBottomColor: colors.stone100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loginSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 4,
    borderBottomWidth: 10,
    borderBottomColor: colors.stone100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.stone50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    gap: 2,
  },
  settingsButtonWrapper: {
    paddingTop: 12,
    paddingRight: 8,
  },
});

export default MyScreen;
