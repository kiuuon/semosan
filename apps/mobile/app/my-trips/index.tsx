import { useMemo } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import Header from '../../components/common/header/Header';
import Typography from '../../components/common/typography/Typography';
import { getMyTrips, type Trip } from '../../lib/apis/trips';
import colors from '../../lib/constants/colors';
import { compareTripsByDistance, getTripScheduleStatus, type TripScheduleStatus } from '../../lib/utils/tripSchedule';

const SECTIONS: { status: TripScheduleStatus; title: string }[] = [
  { status: 'upcoming', title: '다가오는 일정' },
  { status: 'ongoing', title: '진행중인 일정' },
  { status: 'past', title: '지난 일정' },
];

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

function AddTripCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addTripCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.addTripIcon}>
        <Ionicons name="add" size={24} color={colors.forest700} />
      </View>
      <View style={styles.addTripInfo}>
        <Typography.HeadingMd numberOfLines={1}>일정 추가하기</Typography.HeadingMd>
        <Typography.Caption color={colors.stone500}>새로운 산행을 계획해보세요</Typography.Caption>
      </View>
    </TouchableOpacity>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  return (
    <TouchableOpacity style={styles.tripRow} activeOpacity={0.85} onPress={() => router.push(`/trip/${trip._id}`)}>
      {trip.mountain.imageUrl ? (
        <Image source={{ uri: trip.mountain.imageUrl }} style={styles.tripImage} />
      ) : (
        <View style={[styles.tripImage, styles.tripImagePlaceholder]}>
          <Ionicons name="image" size={18} color={colors.stone300} />
        </View>
      )}
      <View style={styles.tripInfo}>
        <Typography.BodyMedium numberOfLines={1} ellipsis>
          {trip.title || trip.mountain.name}
        </Typography.BodyMedium>
        <Typography.Caption color={colors.stone500}>
          {trip.mountain.name} · {formatTripDate(trip.startDate, trip.endDate)}
        </Typography.Caption>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.stone300} />
    </TouchableOpacity>
  );
}

const MyTripsScreen = () => {
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: getMyTrips,
  });

  const grouped = useMemo(() => {
    const buckets: Record<TripScheduleStatus, Trip[]> = {
      upcoming: [],
      ongoing: [],
      past: [],
    };

    for (const trip of trips) {
      const status = getTripScheduleStatus(trip.startDate, trip.endDate);
      buckets[status].push(trip);
    }

    for (const status of Object.keys(buckets) as TripScheduleStatus[]) {
      buckets[status].sort((a, b) => compareTripsByDistance(a, b, status));
    }

    return buckets;
  }, [trips]);

  return (
    <View style={styles.root}>
      <Header title="내 일정" />
      <ScrollView
        contentContainerStyle={[styles.content, trips.length === 0 && !isLoading && styles.contentEmpty]}
        keyboardShouldPersistTaps="handled"
      >
        <AddTripCard onPress={() => router.push('/explore')} />

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.forest700} />
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography.HeadingMd color={colors.stone700}>일정이 없어요</Typography.HeadingMd>
            <Typography.Caption color={colors.stone500}>첫 일정을 계획해보세요</Typography.Caption>
          </View>
        ) : (
          SECTIONS.map(({ status, title }) => {
            const sectionTrips = grouped[status];
            if (sectionTrips.length === 0) return null;

            return (
              <View key={status} style={styles.section}>
                <Typography.HeadingMd>{title}</Typography.HeadingMd>
                <View style={styles.list}>
                  {sectionTrips.map((trip) => (
                    <TripRow key={trip._id} trip={trip} />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 16,
    gap: 28,
    paddingBottom: 40,
  },
  contentEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 48,
  },
  addTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.stone100,
  },
  addTripIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest50,
  },
  addTripInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  loading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  section: {
    gap: 12,
  },
  list: {
    gap: 4,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  tripImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.stone50,
  },
  tripImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});

export default MyTripsScreen;
