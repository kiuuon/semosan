import { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome6, Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import Typography from '../components/common/typography/Typography';
import Drawer from '../components/common/drawer/Drawer';
import MyPanel from '../components/my/MyPanel';
import colors from '../lib/constants/colors';
import useAuth from '../lib/hooks/useAuth';
import useRequireAuth from '../lib/hooks/useRequireAuth';
import { getRecommendedMountains, type MountainSearchItem } from '../lib/apis/mountains';
import { getMyTrips, type Trip } from '../lib/apis/trips';
import { getTripScheduleStatus } from '../lib/utils/tripSchedule';

const SCREEN_PADDING = 20;
const CARD_PEEK = 32;
const CARD_GAP = 12;
const INITIAL_PAGE_WIDTH = Dimensions.get('window').width - SCREEN_PADDING * 2;
const RECOMMEND_CARD_GAP = 14;
const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_WIDTH = SCREEN_WIDTH - SCREEN_PADDING * 2;
const RECOMMEND_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.72);

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

function PastTripRow({ trip }: { trip: Trip }) {
  return (
    <TouchableOpacity style={styles.pastTripRow} activeOpacity={0.85} onPress={() => router.push(`/trip/${trip._id}`)}>
      {trip.mountain.imageUrl ? (
        <Image source={{ uri: trip.mountain.imageUrl }} style={styles.pastTripImage} />
      ) : (
        <View style={[styles.pastTripImage, styles.tripImagePlaceholder]}>
          <Ionicons name="image" size={18} color={colors.stone300} />
        </View>
      )}
      <View style={styles.pastTripInfo}>
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

function shortRegion(region: string) {
  const first = region.split(/[ㆍ,]/)[0]?.trim() || region;
  return first || '지역 정보 없음';
}

function RecommendHeroCard({ mountain }: { mountain: MountainSearchItem }) {
  return (
    <TouchableOpacity
      style={[styles.heroCard, { width: HERO_WIDTH }]}
      activeOpacity={0.92}
      onPress={() =>
        router.push({
          pathname: '/mountain/[id]',
          params: { id: mountain.id, name: mountain.name, region: mountain.region },
        })
      }
    >
      {mountain.imageUrl ? (
        <Image source={{ uri: mountain.imageUrl }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={colors.stone300} />
        </View>
      )}
      <View style={styles.heroScrim} />
      <View style={styles.heroText}>
        <Typography.Caption color={colors.forest100}>
          {mountain.height != null ? `${mountain.height}m · ` : ''}
          {shortRegion(mountain.region)}
        </Typography.Caption>
        <Typography.HeadingXl color={colors.white} numberOfLines={1} ellipsis>
          {mountain.name}
        </Typography.HeadingXl>
      </View>
    </TouchableOpacity>
  );
}

function RecommendSideCard({ mountain }: { mountain: MountainSearchItem }) {
  return (
    <TouchableOpacity
      style={[styles.sideCard, { width: RECOMMEND_CARD_WIDTH }]}
      activeOpacity={0.92}
      onPress={() =>
        router.push({
          pathname: '/mountain/[id]',
          params: { id: mountain.id, name: mountain.name, region: mountain.region },
        })
      }
    >
      {mountain.imageUrl ? (
        <Image source={{ uri: mountain.imageUrl }} style={styles.sideImage} />
      ) : (
        <View style={[styles.sideImage, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color={colors.stone300} />
        </View>
      )}
      <View style={styles.sideScrim} />
      <View style={styles.sideText}>
        <Typography.HeadingMd color={colors.white} numberOfLines={1} ellipsis>
          {mountain.name}
        </Typography.HeadingMd>
        <Typography.Caption color={colors.stone100} numberOfLines={1} ellipsis>
          {shortRegion(mountain.region)}
        </Typography.Caption>
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

  const {
    data: recommend,
    isLoading: isRecommendLoading,
    isError: isRecommendError,
  } = useQuery({
    queryKey: ['mountains', 'recommend', 'today'],
    queryFn: getRecommendedMountains,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const activeTrips = useMemo(
    () => trips.filter((trip) => getTripScheduleStatus(trip.startDate, trip.endDate) !== 'past'),
    [trips],
  );

  const recentPastTrips = useMemo(
    () =>
      trips
        .filter((trip) => getTripScheduleStatus(trip.startDate, trip.endDate) === 'past')
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
        .slice(0, 3),
    [trips],
  );

  const cardWidth = useMemo(() => {
    if (activeTrips.length === 0) return pageWidth;
    return Math.max(pageWidth - CARD_PEEK, 0);
  }, [pageWidth, activeTrips.length]);

  const mountains = recommend?.items ?? [];
  const [hero, ...rest] = mountains;

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

      <View style={styles.recommendArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.recommendScrollContent}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push('/explore')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="산 탐색하기"
          >
            <View style={styles.searchIconWrap}>
              <Ionicons name="search" size={18} color={colors.forest700} />
            </View>
            <View style={styles.searchCopy}>
              <Typography.BodyMedium color={colors.stone700}>산 탐색하기</Typography.BodyMedium>
              <Typography.Caption color={colors.stone500}>이름이나 지역으로 찾아보세요</Typography.Caption>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.stone300} />
          </TouchableOpacity>

          <View style={styles.recommendBand}>
            {isRecommendLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.forest700} />
              </View>
            ) : isRecommendError ? (
              <View style={styles.centered}>
                <Typography.Caption color={colors.stone500}>추천 산을 불러오지 못했습니다.</Typography.Caption>
              </View>
            ) : !hero ? (
              <View style={styles.centered}>
                <Typography.Caption color={colors.stone500}>추천 산이 없어요.</Typography.Caption>
              </View>
            ) : (
              <>
                <View style={styles.recommendCopy}>
                  <Typography.HeadingXl>{recommend!.headline}</Typography.HeadingXl>
                  <Typography.BodyBase color={colors.stone500}>{recommend!.subline}</Typography.BodyBase>
                </View>
                <View style={styles.recommendBody}>
                  <View style={styles.heroWrap}>
                    <RecommendHeroCard mountain={hero} />
                  </View>
                  {rest.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      decelerationRate="fast"
                      snapToInterval={RECOMMEND_CARD_WIDTH + RECOMMEND_CARD_GAP}
                      snapToAlignment="start"
                      disableIntervalMomentum
                      contentContainerStyle={styles.sideRow}
                    >
                      {rest.map((mountain) => (
                        <RecommendSideCard key={`${mountain.id}-${mountain.name}`} mountain={mountain} />
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
              </>
            )}
          </View>

          {recentPastTrips.length > 0 ? (
            <View style={styles.pastSection}>
              <View style={styles.pastHeader}>
                <Typography.HeadingMd>지난 일정</Typography.HeadingMd>
                <TouchableOpacity onPress={() => navigateWithAuth('/my-trips')} hitSlop={8}>
                  <Typography.Caption color={colors.stone500}>더 보기</Typography.Caption>
                </TouchableOpacity>
              </View>
              <View style={styles.pastList}>
                {recentPastTrips.map((trip) => (
                  <PastTripRow key={trip._id} trip={trip} />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={styles.tripsSection}
          pointerEvents="box-none"
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
            {accessToken ? activeTrips.map((trip) => <TripCard key={trip._id} trip={trip} width={cardWidth} />) : null}
            <AddTripCard width={cardWidth} onPress={handleAddTrip} />
          </ScrollView>
        </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: SCREEN_PADDING,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.stone100,
    backgroundColor: colors.white,
  },
  searchIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest50,
  },
  searchCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendArea: {
    flex: 1,
    marginHorizontal: -SCREEN_PADDING,
  },
  recommendScrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  recommendBand: {
    paddingTop: 28,
    paddingBottom: 32,
    gap: 20,
  },
  recommendCopy: {
    paddingHorizontal: SCREEN_PADDING,
    gap: 8,
  },
  recommendBody: {
    gap: 16,
  },
  heroWrap: {
    paddingHorizontal: SCREEN_PADDING,
  },
  heroCard: {
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.stone100,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(27, 67, 50, 0.72)',
  },
  heroText: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    gap: 4,
  },
  sideRow: {
    paddingHorizontal: SCREEN_PADDING,
    gap: RECOMMEND_CARD_GAP,
  },
  sideCard: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.stone100,
  },
  sideImage: {
    ...StyleSheet.absoluteFillObject,
  },
  sideScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(26, 26, 24, 0.7)',
  },
  sideText: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 2,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stone100,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  pastSection: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  pastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastList: {
    gap: 4,
  },
  pastTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  pastTripImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.stone50,
  },
  pastTripInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tripsSection: {
    position: 'absolute',
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    bottom: 0,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
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
    backgroundColor: colors.white,
  },
  addTripCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.stone100,
    backgroundColor: colors.white,
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
