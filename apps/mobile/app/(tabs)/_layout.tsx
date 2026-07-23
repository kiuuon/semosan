import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, Octicons } from '@expo/vector-icons';

import colors from '../../lib/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={() => ({
        headerShown: false,
        title: '',
        tabBarActiveTintColor: colors.forest700,
        tabBarInactiveTintColor: colors.stone300,
        tabBarStyle: {
          height: 66,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.stone100,
        },
        tabBarLabelStyle: {
          fontFamily: 'NotoSansKR_600SemiBold',
          fontSize: 10,
          letterSpacing: -0.2,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="home/index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Feather name="home" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="tracking/index"
        options={{
          title: '트래킹',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="timer-outline" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="feed/index"
        options={{
          title: '피드',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="my/index"
        options={{
          title: 'My',
          tabBarIcon: ({ color }) => <Octicons name="person" color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
