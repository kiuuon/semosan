import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import Typography from '../components/common/typography/Typography';
import Drawer from '../components/common/drawer/Drawer';
import MyPanel from '../components/my/MyPanel';
import colors from '../lib/constants/colors';

export default function HomeScreen() {
  const [isMyDrawerOpen, setIsMyDrawerOpen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography.Display>세모산</Typography.Display>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {}}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="알림 열기"
          >
            <Ionicons name="notifications-outline" size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setIsMyDrawerOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="마이 메뉴 열기"
          >
            <SimpleLineIcons name="menu" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/explore')}>
        <Ionicons name="search" size={20} color={colors.stone300} />
        <Typography.BodyBase color={colors.stone300}>산 탐색하기</Typography.BodyBase>
      </TouchableOpacity>

      <Drawer visible={isMyDrawerOpen} onClose={() => setIsMyDrawerOpen(false)}>
        <MyPanel onNavigate={() => setIsMyDrawerOpen(false)} />
      </Drawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingsButton: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.stone100,
    padding: 20,
    borderRadius: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
