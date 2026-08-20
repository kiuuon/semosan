import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../common/header/Header';
import Typography from '../common/typography/Typography';
import colors from '../../lib/constants/colors';

const OSS_LICENSES_URL = 'https://github.com/kiuuon/semosan/blob/main/OSS_LICENSES.md';

export default function OpenSourceLicensesScreen() {
  const openLicenses = () => {
    Linking.openURL(OSS_LICENSES_URL);
  };

  return (
    <View style={styles.root}>
      <Header title="오픈소스 라이선스" />
      <View style={styles.content}>
        <Typography.BodyBase color={colors.stone700}>
          세모산은 다양한 오픈소스 소프트웨어를 사용하여 제공됩니다. 직접 사용하는 패키지와 라이선스
          목록은 GitHub에서 확인할 수 있습니다.
        </Typography.BodyBase>

        <Pressable style={styles.linkRow} onPress={openLicenses} accessibilityRole="link">
          <View style={styles.linkText}>
            <Typography.BodyMedium color={colors.forest700}>오픈소스 라이선스 목록 보기</Typography.BodyMedium>
            <Typography.Caption color={colors.stone500}>github.com/kiuuon/semosan</Typography.Caption>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.forest700} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.stone100,
    borderRadius: 12,
    backgroundColor: colors.stone50,
  },
  linkText: {
    flex: 1,
    gap: 4,
  },
});
