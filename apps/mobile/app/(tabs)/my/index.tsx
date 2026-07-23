import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import colors from '../../../lib/constants/colors';
import useAuth from '../../../lib/hooks/useAuth';
import { getMe } from '../../../lib/apis/auth';
import Button from '../../../components/common/button/Button';
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
        <View style={styles.profileSection}>
          <Text>My</Text>
          <Button onPress={() => router.push('/auth')}>로그인</Button>
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
            <Typography.HeadingMd>{user?.nickname ?? 'My'}</Typography.HeadingMd>
            <Typography.Caption color={colors.stone700}>{user?.email}</Typography.Caption>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButtonWrapper} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={20} color={colors.forest700} />
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
    backgroundColor: colors.forest50,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
