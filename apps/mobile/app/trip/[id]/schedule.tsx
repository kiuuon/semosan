import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../../components/common/input/Input';
import Typography from '../../../components/common/typography/Typography';
import { searchPlaces, type TourContentTypeId } from '../../../lib/apis/places';
import { getTrip } from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';
import { mapRegionToLegalDong } from '../../../lib/utils/mapRegionToLegalDong';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

type PlaceCategory =
  | 'all'
  | 'attraction'
  | 'lodging'
  | 'shopping'
  | 'restaurant'
  | 'culture'
  | 'festival'
  | 'course'
  | 'leisure';

const PLACE_CATEGORIES: { key: PlaceCategory; label: string; contentTypeId?: TourContentTypeId }[] = [
  { key: 'all', label: '전체' },
  { key: 'attraction', label: '관광지', contentTypeId: '12' },
  { key: 'lodging', label: '숙박', contentTypeId: '32' },
  { key: 'shopping', label: '쇼핑', contentTypeId: '38' },
  { key: 'restaurant', label: '음식점', contentTypeId: '39' },
  { key: 'culture', label: '문화시설', contentTypeId: '14' },
  { key: 'festival', label: '축제공연행사', contentTypeId: '15' },
  { key: 'course', label: '여행코스', contentTypeId: '25' },
  { key: 'leisure', label: '레포츠', contentTypeId: '28' },
];

export default function TripScheduleScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = asParam(params.id);

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('all');

  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId),
    enabled: tripId.length > 0,
  });

  // TODO: 일정 추가 API 연동 전까지 로컬 캐시로만 추가 여부를 표시합니다.
  const { data: addedPlaceIds = [] } = useQuery({
    queryKey: ['places', 'added', tripId],
    queryFn: async () => queryClient.getQueryData<string[]>(['places', 'added', tripId]) ?? [],
    enabled: tripId.length > 0,
    initialData: [],
    staleTime: Infinity,
  });

  const regions = useMemo(
    () => (trip?.mountain.region ? mapRegionToLegalDong(trip.mountain.region) : []),
    [trip?.mountain.region],
  );

  const contentTypeId = PLACE_CATEGORIES.find((item) => item.key === category)?.contentTypeId;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, isFetching } = useInfiniteQuery({
    queryKey: ['places', 'search', tripId, regions, keyword, contentTypeId],
    queryFn: ({ pageParam }) =>
      searchPlaces({
        regions,
        keyword,
        contentTypeId,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: regions.length > 0,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const submitKeyword = () => {
    setKeyword(keywordInput.trim());
  };

  const handleChangeKeyword = (text: string) => {
    setKeywordInput(text);
    if (text.trim() === '') {
      setKeyword('');
    }
  };

  const toggleAddedPlace = (placeId: string) => {
    queryClient.setQueryData<string[]>(['places', 'added', tripId], (prev = []) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId],
    );
  };

  const openPlaceDetail = (place: { id: string; contentTypeId: string; name: string }) => {
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.id,
        contentTypeId: place.contentTypeId,
        name: place.name,
        tripId,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Typography.HeadingMd>일정</Typography.HeadingMd>

      <View style={styles.searchArea}>
        <Input
          placeholder="장소 검색"
          value={keywordInput}
          onChangeText={handleChangeKeyword}
          accessoryRight={
            <Pressable onPress={submitKeyword} hitSlop={8} accessibilityRole="button" accessibilityLabel="검색">
              <Ionicons name="search" size={20} color={colors.stone300} />
            </Pressable>
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          style={styles.tabsScroll}
        >
          {PLACE_CATEGORIES.map((item) => {
            const isActive = item.key === category;

            return (
              <Pressable
                key={item.key}
                onPress={() => setCategory(item.key)}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Typography.Label color={isActive ? colors.white : colors.stone500}>{item.label}</Typography.Label>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.resultArea}>
        {regions.length === 0 ? (
          <View style={styles.centered}>
            <Typography.BodyBase color={colors.stone500}>
              {trip ? '검색 가능한 지역 정보가 없습니다.' : '여행 정보를 불러오는 중...'}
            </Typography.BodyBase>
          </View>
        ) : isPending || (isFetching && !isFetchingNextPage && items.length === 0) ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.forest700} />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Typography.BodyBase color={colors.stone500}>장소 정보를 불러오지 못했습니다.</Typography.BodyBase>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centered}>
            <Typography.BodyBase color={colors.stone500}>검색 결과가 없습니다.</Typography.BodyBase>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={colors.forest700} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isAdded = addedPlaceIds.includes(item.id);

              return (
                <View style={styles.card}>
                  <Pressable
                    style={styles.cardMain}
                    onPress={() => openPlaceDetail(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} 상세 보기`}
                  >
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    ) : (
                      <View style={[styles.image, styles.imagePlaceholder]}>
                        <Ionicons name="image" size={22} color={colors.stone500} />
                      </View>
                    )}
                    <View style={styles.info}>
                      <Typography.HeadingMd ellipsis>{item.name}</Typography.HeadingMd>
                      <Typography.Caption color={colors.stone500} ellipsis>
                        {item.address || '주소 정보 없음'}
                      </Typography.Caption>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleAddedPlace(item.id)}
                    style={[styles.addButton, isAdded && styles.addButtonActive]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={isAdded ? '일정에서 제거' : '일정에 추가'}
                  >
                    <Ionicons
                      name={isAdded ? 'checkmark' : 'add'}
                      size={18}
                      color={isAdded ? colors.forest700 : colors.white}
                    />
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: colors.white,
  },
  searchArea: {
    gap: 12,
  },
  tabsScroll: {
    flexGrow: 0,
    marginHorizontal: -20,
  },
  tabs: {
    gap: 8,
    paddingHorizontal: 20,
  },
  tabItem: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stone50,
  },
  tabItemActive: {
    backgroundColor: colors.forest700,
  },
  resultArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone100,
    shadowColor: colors.stone300,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.stone100,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest700,
  },
  addButtonActive: {
    backgroundColor: colors.forest100,
  },
  footer: {
    paddingVertical: 16,
  },
});
