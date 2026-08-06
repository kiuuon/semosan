import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import TripHeader from '../../../components/trip/header/TripHeader';
import TabBar, { type TabBarProps } from '../../../components/trip/tab-bar/TabBar';
import { getTrip } from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function TripTabsLayout() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = asParam(params.id);

  const { data: trip } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => getTrip(id),
    enabled: id.length > 0,
  });

  const title = trip?.title?.trim() || trip?.mountain.name || '여정';

  return (
    <View style={styles.root}>
      <TripHeader title={title} />
      <Tabs
        backBehavior="none"
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
          name="nearby"
          initialParams={{ id }}
          options={{
            title: '주변',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="map-marker-radius-outline" color={color} size={22} />
            ),
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
