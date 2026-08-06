import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Button from '../../components/common/button/Button';
import Typography from '../../components/common/typography/Typography';
import { getPlaceDetail } from '../../lib/apis/places';
import { addTripPlace, getTripPlaces, removeTripPlace } from '../../lib/apis/trips';
import colors from '../../lib/constants/colors';

const IMAGE_HEIGHT = Dimensions.get('window').width * 0.85;
const COLLAPSED_LINES = 3;

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  const handleMeasure = (event: { nativeEvent: { lines: unknown[] } }) => {
    if (event.nativeEvent.lines.length > COLLAPSED_LINES) {
      setCanExpand(true);
    }
  };

  return (
    <View style={styles.expandable}>
      <Typography.BodyBase style={styles.measureText} onTextLayout={handleMeasure}>
        {text}
      </Typography.BodyBase>
      <Typography.BodyBase color={colors.stone700} numberOfLines={expanded || !canExpand ? undefined : COLLAPSED_LINES}>
        {text}
      </Typography.BodyBase>
      {canExpand ? (
        <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={8} accessibilityRole="button">
          <Typography.BodyMedium color={colors.forest700}>{expanded ? '접기' : '더보기'}</Typography.BodyMedium>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function PlaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const queryClient = useQueryClient();
  const previewListRef = useRef<FlatList<string>>(null);
  const params = useLocalSearchParams<{
    id?: string;
    contentTypeId?: string;
    name?: string;
    tripId?: string;
  }>();

  const id = asParam(params.id);
  const contentTypeId = asParam(params.contentTypeId);
  const fallbackName = asParam(params.name);
  const tripId = asParam(params.tripId);

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: ['places', 'detail', id, contentTypeId],
    queryFn: () => getPlaceDetail({ id, contentTypeId }),
    enabled: id.length > 0 && contentTypeId.length > 0,
  });

  const { data: tripPlaces = [] } = useQuery({
    queryKey: ['trip', tripId, 'places'],
    queryFn: () => getTripPlaces(tripId),
    enabled: tripId.length > 0,
  });

  const addedTripPlace = useMemo(() => tripPlaces.find((place) => place.externalId === id), [tripPlaces, id]);
  const isAdded = !!addedTripPlace;

  const title = data?.name ?? fallbackName;
  const previewImages = useMemo(() => {
    const images = data?.images?.filter(Boolean) ?? [];
    if (images.length > 0) {
      return images;
    }
    return data?.imageUrl ? [data.imageUrl] : [];
  }, [data?.imageUrl, data?.images]);
  const heroImage = previewImages[0] ?? '';
  const gallery = previewImages.slice(1);

  const invalidateTripPlaces = () => {
    queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'places'] });
  };

  const { mutate: addPlace, isPending: isAddPending } = useMutation({
    mutationFn: () => {
      if (!data || !tripId) {
        throw new Error('장소 정보가 없습니다.');
      }
      return addTripPlace(tripId, {
        externalId: data.id,
        contentTypeId: data.contentTypeId,
        name: data.name,
        address: data.address,
        imageUrl: data.imageUrl,
      });
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: '일정에 추가되었습니다.' });
      invalidateTripPlaces();
      router.back();
    },
  });

  const { mutate: removePlace, isPending: isRemovePending } = useMutation({
    mutationFn: () => {
      if (!addedTripPlace || !tripId) {
        throw new Error('추가된 장소 정보가 없습니다.');
      }
      return removeTripPlace(tripId, addedTripPlace._id);
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: '일정에서 제거되었습니다.' });
      invalidateTripPlaces();
    },
  });

  const isSchedulePending = isAddPending || isRemovePending;

  const openPreview = (index: number) => {
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
  };

  const handlePreviewScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    setPreviewIndex(nextIndex);
  };

  const handleScheduleAction = () => {
    if (!data || !tripId || isSchedulePending) {
      return;
    }

    if (isAdded) {
      removePlace();
      return;
    }

    addPlace();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ contentStyle: { paddingTop: 0 } }} />

      {isPending ? (
        <>
          <View style={[styles.header, styles.loadingHeader, { paddingTop: insets.top + 16 }]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.stone900} />
            </Pressable>
          </View>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.forest700} />
          </View>
        </>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.hero}>
              {heroImage ? (
                <Pressable
                  onPress={() => openPreview(0)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="이미지 크게 보기"
                >
                  <Image source={{ uri: heroImage }} style={styles.image} />
                </Pressable>
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="image" size={40} color={colors.stone500} />
                </View>
              )}
              <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="뒤로가기"
                  style={styles.backButton}
                >
                  <Ionicons name="chevron-back" size={24} color={colors.stone900} />
                </Pressable>
              </View>
            </View>

            <View style={styles.content}>
              {isError || !data ? (
                <View style={styles.centered}>
                  <Typography.BodyBase color={colors.stone500}>장소 정보를 불러오지 못했습니다.</Typography.BodyBase>
                </View>
              ) : (
                <>
                  <View style={styles.titleBlock}>
                    <Typography.HeadingXl>{title}</Typography.HeadingXl>
                    <Typography.Caption color={colors.stone500}>
                      {data.contentTypeLabel}
                      {data.address ? ` · ${data.address}` : ''}
                    </Typography.Caption>
                  </View>

                  {gallery.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.gallery}
                    >
                      {gallery.map((url, index) => (
                        <Pressable
                          key={url}
                          onPress={() => openPreview(index + 1)}
                          accessibilityRole="imagebutton"
                          accessibilityLabel="이미지 크게 보기"
                        >
                          <Image source={{ uri: url }} style={styles.galleryImage} />
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}

                  {data.overview ? (
                    <View style={styles.section}>
                      <Typography.HeadingMd>소개</Typography.HeadingMd>
                      <ExpandableText text={data.overview} />
                    </View>
                  ) : null}

                  {data.infos.length > 0 ? (
                    <View style={styles.section}>
                      <Typography.HeadingMd>이용 정보</Typography.HeadingMd>
                      <View style={styles.infoList}>
                        {data.infos.map((item) => (
                          <View key={`${item.label}-${item.value}`} style={styles.infoRow}>
                            <Typography.Label color={colors.stone500} style={styles.infoLabel}>
                              {item.label}
                            </Typography.Label>
                            <Typography.BodyBase color={colors.stone700} style={styles.infoValue}>
                              {item.value}
                            </Typography.BodyBase>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {data.extras.length > 0 ? (
                    <View style={styles.section}>
                      <Typography.HeadingMd>추가 정보</Typography.HeadingMd>
                      <View style={styles.extraList}>
                        {data.extras.map((item) => (
                          <View key={`${item.label}-${item.value}`} style={styles.extraItem}>
                            <Typography.BodyMedium color={colors.stone900}>{item.label}</Typography.BodyMedium>
                            <ExpandableText text={item.value} />
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {data.tel || data.homepage ? (
                    <View style={styles.section}>
                      <Typography.HeadingMd>연락처</Typography.HeadingMd>
                      <View style={styles.contactList}>
                        {data.tel ? (
                          <Pressable
                            style={styles.contactRow}
                            onPress={() => Linking.openURL(`tel:${data.tel}`)}
                            accessibilityRole="link"
                          >
                            <Ionicons name="call-outline" size={18} color={colors.forest700} />
                            <Typography.BodyBase color={colors.forest700}>{data.tel}</Typography.BodyBase>
                          </Pressable>
                        ) : null}
                        {data.homepage ? (
                          <Pressable
                            style={styles.contactRow}
                            onPress={() => Linking.openURL(data.homepage)}
                            accessibilityRole="link"
                          >
                            <Ionicons name="globe-outline" size={18} color={colors.forest700} />
                            <Typography.BodyBase color={colors.forest700} ellipsis>
                              {data.homepage}
                            </Typography.BodyBase>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </ScrollView>

          {tripId ? (
            <View style={styles.footer}>
              <Button
                fullWidth
                disabled={!data || isSchedulePending}
                loading={isSchedulePending}
                onPress={handleScheduleAction}
              >
                {isAdded ? '일정에서 제거하기' : '일정에 추가하기'}
              </Button>
            </View>
          ) : null}
        </>
      )}

      <Modal visible={previewIndex != null} transparent animationType="fade" onRequestClose={closePreview}>
        <View style={styles.previewContainer}>
          <Pressable
            onPress={closePreview}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="이미지 닫기"
            style={[styles.previewClose, { top: insets.top + 16 }]}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </Pressable>

          {previewIndex != null ? (
            <FlatList
              key={`preview-${previewIndex}`}
              ref={previewListRef}
              data={previewImages}
              keyExtractor={(item, index) => `${item}-${index}`}
              horizontal
              pagingEnabled
              initialScrollIndex={previewIndex}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handlePreviewScrollEnd}
              getItemLayout={(_, index) => ({
                length: windowWidth,
                offset: windowWidth * index,
                index,
              })}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.previewPage, { width: windowWidth, height: windowHeight }]}
                  onPress={closePreview}
                >
                  <Image source={{ uri: item }} style={styles.previewImage} resizeMode="contain" />
                </Pressable>
              )}
            />
          ) : null}

          {previewImages.length > 1 && previewIndex != null ? (
            <View style={[styles.previewCounter, { bottom: insets.bottom + 24 }]}>
              <Typography.Label color={colors.white}>
                {previewIndex + 1} / {previewImages.length}
              </Typography.Label>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: colors.stone100,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  loadingHeader: {
    position: 'relative',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 28,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.stone100,
    backgroundColor: colors.white,
  },
  titleBlock: {
    gap: 8,
  },
  gallery: {
    gap: 8,
  },
  galleryImage: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: colors.stone100,
  },
  section: {
    gap: 12,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    width: 88,
  },
  infoValue: {
    flex: 1,
  },
  extraList: {
    gap: 16,
  },
  extraItem: {
    gap: 8,
  },
  contactList: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandable: {
    gap: 8,
  },
  measureText: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    width: '100%',
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  previewClose: {
    position: 'absolute',
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  previewPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewCounter: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
});
