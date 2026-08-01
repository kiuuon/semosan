import { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getMountainDetail } from '../../lib/apis/mountains';
import colors from '../../lib/constants/colors';
import useRequireAuth from '../../lib/hooks/useRequireAuth';
import Button from '../../components/common/button/Button';
import Typography from '../../components/common/typography/Typography';

const IMAGE_HEIGHT = Dimensions.get('window').width * 0.85;
const COLLAPSED_LINES = 3;

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function isUrlSubtitle(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  const handleMeasure = (event: any) => {
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

function MountainDetail() {
  const insets = useSafeAreaInsets();
  const { navigateWithAuth } = useRequireAuth();
  const params = useLocalSearchParams<{ id?: string; name?: string; region?: string }>();
  const id = asParam(params.id);
  const name = asParam(params.name);
  const region = asParam(params.region);

  const { data, isPending, isError } = useQuery({
    queryKey: ['mountains', 'detail', id, name, region],
    queryFn: () => getMountainDetail({ id, name, region }),
    enabled: id.length > 0 && name.length > 0 && region.length > 0,
  });

  const title = data?.name ?? name;
  const subtitle = data?.subtitle && !isUrlSubtitle(data.subtitle) ? data.subtitle : '';

  return (
    <View style={styles.container}>
      {/* 히어로 이미지를 노치까지 올리기 위해 이 화면만 상단 인셋을 해제한다. */}
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
              {data?.imageUrl ? (
                <Image source={{ uri: data.imageUrl }} style={styles.image} />
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
                  <Typography.BodyBase color={colors.stone500}>산 정보를 불러오지 못했습니다.</Typography.BodyBase>
                </View>
              ) : (
                <>
                  <View style={styles.titleBlock}>
                    <Typography.HeadingXl>{title}</Typography.HeadingXl>
                    {subtitle ? (
                      <Typography.BodyMedium color={colors.stone700}>{subtitle}</Typography.BodyMedium>
                    ) : null}
                    <Typography.Caption color={colors.stone500}>
                      {data.height != null ? `${data.height}m` : '-'} · {data.region || '지역 정보 없음'}
                    </Typography.Caption>
                  </View>

                  {data.description ? (
                    <View style={styles.section}>
                      <Typography.HeadingMd>소개</Typography.HeadingMd>
                      <ExpandableText text={data.description} />
                    </View>
                  ) : null}

                  {data.transportInfo ? (
                    <View style={styles.section}>
                      <Typography.HeadingMd>교통 정보</Typography.HeadingMd>
                      <ExpandableText text={data.transportInfo} />
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              fullWidth
              disabled={!data}
              onPress={() => {
                if (!data) return;
                navigateWithAuth({
                  pathname: '/create-trip',
                  params: {
                    mountainId: data.id,
                    mountainName: data.name,
                    mountainRegion: data.region,
                    ...(data.height != null ? { mountainHeight: String(data.height) } : {}),
                    ...(data.imageUrl ? { mountainImageUrl: data.imageUrl } : {}),
                  },
                });
              }}
            >
              일정 추가하기
            </Button>
          </View>
        </>
      )}
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
  section: {
    gap: 12,
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
});

export default MountainDetail;
