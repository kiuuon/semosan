import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import Button from '../common/button/Button';
import Typography from '../common/typography/Typography';
import {
  CONCENTRATION_CONTENT_TYPE_IDS,
  getPlaceConcentrationRate,
  type ConcentrationRatePoint,
  type PlaceDetail,
} from '../../lib/apis/places';
import colors from '../../lib/constants/colors';
import { mapRegionToLegalDong } from '../../lib/utils/mapRegionToLegalDong';

const CHART_HEIGHT = 156;
const CHART_PADDING_TOP = 24;
const CHART_PADDING_BOTTOM = 28;
const CHART_PADDING_X = 20;
const RATE_MAX = 100;
const POINT_GAP = 56;

const INFO_ITEMS = [
  {
    title: '무엇을 보여주나요?',
    body: '관광지에 방문자가 얼마나 몰리는지 예측한 상대 지표입니다. 가장 붐비는 시기를 100으로 두고, 여행 날짜별 집중 정도를 환산해 보여줍니다.',
  },
  {
    title: '어떤 기간 데이터인가요?',
    body: '조회일 기준 대략 한달 안의 예보를 사용합니다. 앱에서는 여행 일정에 맞춰 표시하고, 예보가 없는 날짜는 0으로 나타냅니다.',
  },
  {
    title: '어떻게 만들어지나요?',
    body: 'KT 이동통신 데이터와 2018년 이후 방문자 패턴을 바탕으로, 평일·공휴일·휴가철 같은 시기 특성을 반영해 머신러닝으로 추정합니다.',
  },
  {
    title: '참고해 주세요',
    body: '환경 변화에 따라 실제 방문자 수와 예측값이 다를 수 있습니다. 일정 참고용으로 활용해 주세요.',
  },
] as const;

function toDateParam(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatChartDate(ymd: string) {
  if (ymd.length !== 8) {
    return ymd;
  }
  return `${Number(ymd.slice(4, 6))}/${Number(ymd.slice(6, 8))}`;
}

function resolveAreaCodes(place: PlaceDetail) {
  if (place.lDongRegnCd && place.lDongSignguCd) {
    return {
      areaCd: place.lDongRegnCd,
      signguCd: `${place.lDongRegnCd}${place.lDongSignguCd}`,
    };
  }

  const mapped = mapRegionToLegalDong(place.address)[0];
  if (!mapped?.lDongRegnCd || !mapped.lDongSignguCd) {
    return null;
  }

  return {
    areaCd: mapped.lDongRegnCd,
    signguCd: `${mapped.lDongRegnCd}${mapped.lDongSignguCd}`,
  };
}

function buildChartLayout(points: ConcentrationRatePoint[], width: number) {
  const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const plotWidth = Math.max(width - CHART_PADDING_X * 2, 1);
  const stepX = points.length <= 1 ? 0 : plotWidth / (points.length - 1);

  const coords = points.map((point, index) => {
    const rate = Math.min(Math.max(point.rate, 0), RATE_MAX);
    const x = CHART_PADDING_X + stepX * index;
    const y = CHART_PADDING_TOP + plotHeight * (1 - rate / RATE_MAX);
    return { ...point, rate, x, y, isEmpty: rate <= 0 };
  });

  return {
    coords,
    polylinePoints: coords.map((coord) => `${coord.x},${coord.y}`).join(' '),
  };
}

type Props = {
  place: PlaceDetail;
  startDate: string;
  endDate: string;
};

export default function ConcentrationRateSection({ place, startDate, endDate }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const areaCodes = resolveAreaCodes(place);
  const tripStart = toDateParam(startDate);
  const tripEnd = toDateParam(endDate);
  const enabled =
    CONCENTRATION_CONTENT_TYPE_IDS.has(place.contentTypeId) &&
    !!areaCodes &&
    tripStart.length > 0 &&
    tripEnd.length > 0;

  const { data, isPending, isError } = useQuery({
    queryKey: ['places', 'concentration-rate', place.name, areaCodes?.areaCd, areaCodes?.signguCd, tripStart, tripEnd],
    queryFn: () =>
      getPlaceConcentrationRate({
        name: place.name,
        areaCd: areaCodes!.areaCd,
        signguCd: areaCodes!.signguCd,
        startDate: tripStart,
        endDate: tripEnd,
      }),
    enabled,
  });

  const contentWidth = windowWidth - 40;
  const chartWidth = useMemo(() => {
    const pointCount = data?.points?.length ?? 0;
    if (pointCount <= 1) {
      return contentWidth;
    }
    return Math.max(contentWidth, CHART_PADDING_X * 2 + POINT_GAP * (pointCount - 1));
  }, [contentWidth, data?.points?.length]);

  const layout = useMemo(() => {
    if (!data?.points?.length) {
      return null;
    }
    return buildChartLayout(data.points, chartWidth);
  }, [chartWidth, data?.points]);

  if (!enabled || isError || (!isPending && data?.status === 'unavailable')) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Typography.HeadingMd>방문자 집중률</Typography.HeadingMd>
          <Pressable
            onPress={() => setIsInfoVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="방문자 집중률 설명 보기"
            style={styles.infoButton}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.stone500} />
          </Pressable>
        </View>
        <Typography.Caption color={colors.stone500}>
          여행 일정 기준 · 가장 붐비는 시기를 100으로 둔 예측값
        </Typography.Caption>
      </View>

      {isPending || data?.status !== 'available' || !layout ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.forest700} />
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              <Line
                x1={CHART_PADDING_X}
                y1={CHART_HEIGHT - CHART_PADDING_BOTTOM}
                x2={chartWidth - CHART_PADDING_X}
                y2={CHART_HEIGHT - CHART_PADDING_BOTTOM}
                stroke={colors.stone100}
                strokeWidth={1}
              />
              <Line
                x1={CHART_PADDING_X}
                y1={CHART_PADDING_TOP}
                x2={chartWidth - CHART_PADDING_X}
                y2={CHART_PADDING_TOP}
                stroke={colors.stone100}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {layout.coords.length > 1 ? (
                <Polyline
                  points={layout.polylinePoints}
                  fill="none"
                  stroke={colors.forest500}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {layout.coords.map((coord) => (
                <Circle
                  key={`dot-${coord.date}`}
                  cx={coord.x}
                  cy={coord.y}
                  r={4.5}
                  fill={coord.isEmpty ? colors.stone300 : colors.forest700}
                  stroke={colors.white}
                  strokeWidth={2}
                />
              ))}
              {layout.coords.map((coord) => (
                <SvgText
                  key={`rate-${coord.date}`}
                  x={coord.x}
                  y={coord.y - 10}
                  fill={coord.isEmpty ? colors.stone300 : colors.stone500}
                  fontSize={10}
                  fontFamily="NotoSansKR_500Medium"
                  textAnchor="middle"
                >
                  {Math.round(coord.rate)}
                </SvgText>
              ))}
              {layout.coords.map((coord) => (
                <SvgText
                  key={`date-${coord.date}`}
                  x={coord.x}
                  y={CHART_HEIGHT - 8}
                  fill={colors.stone700}
                  fontSize={10}
                  fontFamily="NotoSansKR_500Medium"
                  textAnchor="middle"
                >
                  {formatChartDate(coord.date)}
                </SvgText>
              ))}
            </Svg>
          </ScrollView>
          {data.message ? <Typography.Caption color={colors.stone500}>{data.message}</Typography.Caption> : null}
        </>
      )}

      <Modal visible={isInfoVisible} transparent animationType="fade" onRequestClose={() => setIsInfoVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsInfoVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.forest700} />
              <Typography.HeadingMd>방문자 집중률이란?</Typography.HeadingMd>
            </View>

            <View style={styles.modalBody}>
              {INFO_ITEMS.map((item) => (
                <View key={item.title} style={styles.modalItem}>
                  <Typography.BodyMedium color={colors.stone900}>{item.title}</Typography.BodyMedium>
                  <Typography.BodyBase color={colors.stone700}>{item.body}</Typography.BodyBase>
                </View>
              ))}
            </View>

            <Typography.Caption color={colors.stone500}>출처: 한국관광공사 · KT 이동통신 데이터</Typography.Caption>

            <Button fullWidth variant="ghost" onPress={() => setIsInfoVisible(false)}>
              닫기
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoButton: {
    paddingTop: 1,
  },
  loading: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalBody: {
    gap: 16,
  },
  modalItem: {
    gap: 6,
  },
});
