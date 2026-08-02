import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import TabBar, { type TabBarProps } from '../../../components/common/tab-bar/TabBar';
import colors from '../../../lib/constants/colors';

export default function TripTabsLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <TabBar {...(props as unknown as TabBarProps)} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          initialParams={{ id }}
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          initialParams={{ id }}
          options={{
            title: '일정',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-month-outline" color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="feed"
          initialParams={{ id }}
          options={{
            title: '피드',
            tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          initialParams={{ id }}
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => <Octicons name="gear" color={color} size={22} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
