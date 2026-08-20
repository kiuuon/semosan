import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Header from '../common/header/Header';
import Typography from '../common/typography/Typography';
import colors from '../../lib/constants/colors';
import { OSS_LICENSES, OSS_LICENSES_INTRO } from '../../lib/data/ossLicenses';

async function openRepository(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Toast.show({ type: 'error', text1: '링크를 열 수 없습니다.' });
      return;
    }
    await Linking.openURL(url);
  } catch {
    Toast.show({ type: 'error', text1: '링크를 열 수 없습니다.' });
  }
}

export default function OpenSourceLicensesScreen() {
  return (
    <View style={styles.root}>
      <Header title="오픈소스 라이선스" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography.BodyBase color={colors.stone700}>{OSS_LICENSES_INTRO}</Typography.BodyBase>
        <Typography.Caption color={colors.stone500}>
          하위 의존성 라이선스는 각 패키지 저장소의 고지를 따릅니다.
        </Typography.Caption>

        <View style={styles.list}>
          {OSS_LICENSES.map((item) => {
            const hasRepo = item.repository.length > 0;

            return (
              <Pressable
                key={item.name}
                style={styles.row}
                disabled={!hasRepo}
                onPress={() => {
                  if (hasRepo) void openRepository(item.repository);
                }}
                accessibilityRole={hasRepo ? 'link' : 'text'}
              >
                <View style={styles.rowText}>
                  <Typography.BodyMedium ellipsis>{item.name}</Typography.BodyMedium>
                  <Typography.Caption color={colors.stone500}>
                    {item.license} · v{item.version || '-'}
                  </Typography.Caption>
                </View>
                {hasRepo ? <Ionicons name="open-outline" size={16} color={colors.stone300} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
    gap: 12,
  },
  list: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.stone100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone100,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
