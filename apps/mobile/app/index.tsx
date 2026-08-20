import { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { FontAwesome6, Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import Typography from '../components/common/typography/Typography';
import Drawer from '../components/common/drawer/Drawer';
import MyPanel from '../components/my/MyPanel';
import colors from '../lib/constants/colors';
import useAuth from '../lib/hooks/useAuth';
import useRequireAuth from '../lib/hooks/useRequireAuth';
import { getMyTrips, type Trip } from '../lib/apis/trips';
import { getTripScheduleStatus } from '../lib/utils/tripSchedule';

const SCREEN_PADDING = 20;
const CARD_PEEK = 32;
const CARD_GAP = 12;
const INITIAL_PAGE_WIDTH = Dimensions.get('window').width - SCREEN_PADDING * 2;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatTripDate(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startLabel = `${start.getMonth() + 1}.${start.getDate()}`;
  const endLabel = `${end.getMonth() + 1}.${end.getDate()}`;

  if (start.toDateString() === end.toDateString()) {
    return startLabel;
  }

  return `${startLabel} - ${endLabel}`;
}

function getDdayLabel(startDate: string, endDate: string) {
  const today = startOfDay(new Date());
  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));
  const diffDays = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `D-${diffDays}`;
  if (diffDays === 0) return 'D-Day';
  if (today.getTime() <= end.getTime()) return '진행중';
  return '완료';
}

function TripCard({ trip, width }: { trip: Trip; width: number }) {
  const dday = getDdayLabel(trip.startDate, trip.endDate);

  return (
    <TouchableOpacity
      style={[styles.tripCard, { width }]}
      activeOpacity={0.85}
      onPress={() => router.push(`/trip/${trip._id}`)}
    >
      {trip.mountain.imageUrl ? (
        <Image source={{ uri: trip.mountain.imageUrl }} style={styles.tripImage} />
      ) : (
        <View style={[styles.tripImage, styles.tripImagePlaceholder]}>
          <Ionicons name="image" size={20} color={colors.stone300} />
        </View>
      )}
      <View style={styles.tripInfo}>
        <Typography.HeadingMd numberOfLines={1} ellipsis>
          {trip.title || trip.mountain.name}
        </Typography.HeadingMd>
        <Typography.Caption color={colors.stone500}>{formatTripDate(trip.startDate, trip.endDate)}</Typography.Caption>
      </View>
      <View style={styles.ddayBadge}>
        <Typography.Label color={colors.forest700}>{dday}</Typography.Label>
      </View>
    </TouchableOpacity>
  );
}

function AddTripCard({ width, onPress }: { width: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tripCard, styles.addTripCard, { width }]} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.tripImage, styles.addTripIcon]}>
        <Ionicons name="add" size={24} color={colors.forest700} />
      </View>
      <View style={styles.tripInfo}>
        <Typography.HeadingMd numberOfLines={1}>일정 추가하기</Typography.HeadingMd>
        <Typography.Caption color={colors.stone500}>새로운 산행을 계획해보세요</Typography.Caption>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [isMyDrawerOpen, setIsMyDrawerOpen] = useState(false);
  const [pageWidth, setPageWidth] = useState(INITIAL_PAGE_WIDTH);
  const { accessToken } = useAuth();
  const { navigateWithAuth } = useRequireAuth();

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: getMyTrips,
    enabled: !!accessToken,
  });

  const activeTrips = useMemo(
    () => trips.filter((trip) => getTripScheduleStatus(trip.startDate, trip.endDate) !== 'past'),
    [trips],
  );

  const cardWidth = useMemo(() => {
    if (activeTrips.length === 0) return pageWidth;
    return Math.max(pageWidth - CARD_PEEK, 0);
  }, [pageWidth, activeTrips.length]);

  function handleAddTrip() {
    navigateWithAuth('/explore');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Typography.Display>세모산</Typography.Display>
          <FontAwesome6 name="mountain" size={18} color={colors.forest700} />
        </View>
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

      <View
        style={styles.tripsSection}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          if (width > 0 && width !== pageWidth) {
            setPageWidth(width);
          }
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + CARD_GAP}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={styles.tripsScrollContent}
        >
          {accessToken
            ? activeTrips.map((trip) => <TripCard key={trip._id} trip={trip} width={cardWidth} />)
            : null}
          <AddTripCard width={cardWidth} onPress={handleAddTrip} />
        </ScrollView>
      </View>

      <Drawer visible={isMyDrawerOpen} onClose={() => setIsMyDrawerOpen(false)}>
        <MyPanel onNavigate={() => setIsMyDrawerOpen(false)} />
      </Drawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: SCREEN_PADDING,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  tripsSection: {
    marginTop: 'auto',
    paddingTop: 20,
    paddingBottom: 20,
  },
  tripsScrollContent: {
    gap: CARD_GAP,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderColor: colors.stone100,
    borderWidth: 2,
  },
  addTripCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.stone100,
  },
  tripImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.stone100,
  },
  tripImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTripIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest50,
  },
  tripInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  ddayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.forest100,
  },
});
