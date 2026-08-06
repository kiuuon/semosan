import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome6, Ionicons, SimpleLineIcons } from '@expo/vector-icons';

import Drawer from '../../common/drawer/Drawer';
import Typography from '../../common/typography/Typography';
import MyPanel from '../../my/MyPanel';
import colors from '../../../lib/constants/colors';

interface TripHeaderProps {
  title: string;
  onMapPress?: () => void;
  onNotificationPress?: () => void;
}

function TripHeader({ title, onMapPress, onNotificationPress }: TripHeaderProps) {
  const [isMyDrawerOpen, setIsMyDrawerOpen] = useState(false);

  return (
    <>
      <View style={styles.header} testID="trip-header">
        <View style={styles.headerTitle}>
          <Typography.Display style={styles.titleText} ellipsis>
            {title}
          </Typography.Display>
          <FontAwesome6 name="mountain" size={18} color={colors.forest700} />
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onMapPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="지도 열기"
          >
            <Ionicons name="map-outline" size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onNotificationPress}
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

      <Drawer visible={isMyDrawerOpen} onClose={() => setIsMyDrawerOpen(false)}>
        <MyPanel onNavigate={() => setIsMyDrawerOpen(false)} />
      </Drawer>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: colors.white,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  titleText: {
    flexShrink: 1,
  },
  settingsButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default TripHeader;
