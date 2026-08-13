import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import PlaceCommentsModal from '../../../components/trip/place-feed/PlaceCommentsModal';
import PlaceFeedCard from '../../../components/trip/place-feed/PlaceFeedCard';
import Typography from '../../../components/common/typography/Typography';
import { getMe } from '../../../lib/apis/auth';
import { getTripPlaces, toggleTripPlaceLike, type TripPlace } from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function TripHomeScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = asParam(params.id);

  const [selectedPlace, setSelectedPlace] = useState<TripPlace | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const {
    data: places = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['trip', tripId, 'places'],
    queryFn: () => getTripPlaces(tripId),
    enabled: tripId.length > 0,
  });

  const { mutate: toggleLike } = useMutation({
    mutationFn: (placeId: string) => toggleTripPlaceLike(tripId, placeId),
    onMutate: async (placeId) => {
      await queryClient.cancelQueries({ queryKey: ['trip', tripId, 'places'] });
      const previous = queryClient.getQueryData<TripPlace[]>(['trip', tripId, 'places']);
      const userId = me?._id;

      if (previous && userId) {
        queryClient.setQueryData<TripPlace[]>(['trip', tripId, 'places'], (current) =>
          (current ?? []).map((place) => {
            if (place._id !== placeId) {
              return place;
            }
            const liked = place.likedUserIds.includes(userId);
            return {
              ...place,
              likedUserIds: liked ? place.likedUserIds.filter((id) => id !== userId) : [...place.likedUserIds, userId],
            };
          }),
        );
      }

      return { previous };
    },
    onError: (_error, _placeId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['trip', tripId, 'places'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'places'] });
    },
  });

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest700} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Typography.BodyBase color={colors.stone500}>장소를 불러오지 못했습니다.</Typography.BodyBase>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={places}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, places.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Typography.HeadingMd>아직 추가된 장소가 없어요</Typography.HeadingMd>
            <Typography.BodyBase color={colors.stone500}>주변 탭에서 장소를 추가해 보세요.</Typography.BodyBase>
          </View>
        }
        renderItem={({ item }) => (
          <PlaceFeedCard
            place={item}
            liked={me?._id ? item.likedUserIds.includes(me._id) : false}
            onPress={() =>
              router.push({
                pathname: '/place/[id]',
                params: {
                  id: item.externalId,
                  contentTypeId: item.contentTypeId,
                  name: item.name,
                  tripId,
                },
              })
            }
            onToggleLike={() => toggleLike(item._id)}
            onPressComment={() => setSelectedPlace(item)}
          />
        )}
      />

      {selectedPlace ? (
        <PlaceCommentsModal
          visible
          tripId={tripId}
          placeId={selectedPlace._id}
          placeName={selectedPlace.name}
          onClose={() => setSelectedPlace(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingBottom: 80,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
});
