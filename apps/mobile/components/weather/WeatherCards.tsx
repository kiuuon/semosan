import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { MountainWeather, MountainWeatherDay } from '../../lib/apis/mountains';
import colors from '../../lib/constants/colors';
import { formatTemp, formatWeatherDateParts, weatherIonicon } from '../../lib/utils/weatherDisplay';
import Typography from '../common/typography/Typography';

const TRUNCATED_MESSAGE = '16일 이후 날씨까지만 보여집니다';
const TOO_OLD_MESSAGE = '너무 오래된 일정이라 날씨를 불러올 수 없습니다.';
const DAY_CARD_WIDTH = 84;
const DAY_CARD_GAP = 8;

function WeatherDayCard({ day, muted }: { day: MountainWeatherDay; muted?: boolean }) {
  const { date, weekday } = formatWeatherDateParts(day.date);

  return (
    <View style={[styles.dayCard, muted ? styles.dayCardMuted : null]}>
      <View style={styles.dayDate}>
        <Typography.Caption color={colors.stone900}>{date}</Typography.Caption>
        {weekday ? <Typography.Caption color={colors.stone500}>{weekday}</Typography.Caption> : null}
      </View>
      <Ionicons name={weatherIonicon(day.weatherCode)} size={26} color={colors.sky700} />
      <Typography.Caption color={colors.stone700} numberOfLines={1} ellipsis>
        {day.weatherLabel}
      </Typography.Caption>
      <Typography.Label color={colors.sky900}>
        {formatTemp(day.tMin)}~{formatTemp(day.tMax)}
      </Typography.Label>
      <Typography.Caption color={colors.stone500}>
        {day.precipProb == null ? '-' : `${Math.round(day.precipProb)}%`}
      </Typography.Caption>
    </View>
  );
}

function WeatherDayStrip({ days, inset = 16, muted }: { days: MountainWeatherDay[]; inset?: number; muted?: boolean }) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={DAY_CARD_WIDTH + DAY_CARD_GAP}
      snapToAlignment="start"
      contentContainerStyle={[styles.dayStrip, { paddingHorizontal: inset }]}
    >
      {days.map((day) => (
        <WeatherDayCard key={day.date} day={day} muted={muted} />
      ))}
    </ScrollView>
  );
}

export function TodayWeatherCard({
  weather,
  isPending,
  isError,
}: {
  weather?: MountainWeather;
  isPending: boolean;
  isError: boolean;
}) {
  const today = weather?.days[0];
  const current = weather?.current;

  return (
    <View style={styles.todayCard}>
      <Typography.HeadingMd style={styles.todayPad}>날씨</Typography.HeadingMd>
      {isPending ? (
        <ActivityIndicator color={colors.sky700} style={styles.todayPad} />
      ) : isError || !weather ? (
        <Typography.BodyBase color={colors.stone500} style={styles.todayPad}>
          날씨를 불러오지 못했습니다.
        </Typography.BodyBase>
      ) : (
        <>
          <View style={styles.todayRow}>
            <Ionicons
              name={weatherIonicon(current?.weatherCode ?? today?.weatherCode ?? 2)}
              size={36}
              color={colors.sky700}
            />
            <View style={styles.todayCopy}>
              <Typography.HeadingLg color={colors.sky900}>
                {formatTemp(current?.temperature ?? today?.tMax)}
              </Typography.HeadingLg>
              <Typography.BodyMedium color={colors.stone700}>
                {current?.weatherLabel ?? today?.weatherLabel ?? '날씨 정보 없음'}
              </Typography.BodyMedium>
            </View>
          </View>
          {weather.days.length > 0 ? (
            <View style={styles.todayStripWrap}>
              <WeatherDayStrip days={weather.days} />
            </View>
          ) : null}
          <Typography.Caption color={colors.stone300} style={styles.todayPad}>
            {weather.attribution}
          </Typography.Caption>
        </>
      )}
    </View>
  );
}

export function TripWeatherCard({
  weather,
  isPending,
  isError,
}: {
  weather?: MountainWeather;
  isPending: boolean;
  isError: boolean;
}) {
  const emptyMessage = weather?.tooOld ? TOO_OLD_MESSAGE : '해당 기간의 날씨를 불러올 수 없습니다.';

  return (
    <View style={styles.section}>
      <Typography.Label color={colors.stone500}>날씨</Typography.Label>
      <View style={styles.listCard}>
        {isPending ? (
          <View style={styles.padded}>
            <ActivityIndicator color={colors.sky700} />
          </View>
        ) : isError || !weather ? (
          <View style={styles.padded}>
            <Typography.BodyBase color={colors.stone500}>날씨를 불러오지 못했습니다.</Typography.BodyBase>
          </View>
        ) : weather.days.length === 0 && !weather.truncated ? (
          <View style={styles.padded}>
            <Typography.BodyBase color={colors.stone500}>{emptyMessage}</Typography.BodyBase>
          </View>
        ) : (
          <>
            <View style={styles.tripStripWrap}>
              <WeatherDayStrip days={weather.days} muted />
            </View>
            {weather.truncated ? (
              <View style={styles.truncatedNote}>
                <Typography.Caption color={colors.stone500}>{TRUNCATED_MESSAGE}</Typography.Caption>
              </View>
            ) : null}
            <View style={styles.note}>
              <Typography.Caption color={colors.stone300}>{weather.attribution}</Typography.Caption>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  todayCard: {
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.sky50,
    borderWidth: 1,
    borderColor: colors.sky100,
    overflow: 'hidden',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  todayCopy: {
    gap: 2,
  },
  todayPad: {
    paddingHorizontal: 16,
  },
  todayStripWrap: {
    marginTop: 4,
  },
  tripStripWrap: {
    paddingTop: 12,
  },
  dayStrip: {
    gap: DAY_CARD_GAP,
  },
  dayCard: {
    width: DAY_CARD_WIDTH,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sky100,
  },
  dayDate: {
    alignItems: 'center',
    gap: 0,
  },
  dayCardMuted: {
    backgroundColor: colors.sky50,
  },
  section: {
    gap: 8,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.stone100,
    overflow: 'hidden',
    shadowColor: colors.stone300,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  padded: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  note: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  truncatedNote: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
});
