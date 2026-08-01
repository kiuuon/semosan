import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, type DateData } from 'react-native-calendars';
import Toast from 'react-native-toast-message';

import Header from '../../components/common/header/Header';
import Input from '../../components/common/input/Input';
import Button from '../../components/common/button/Button';
import Typography from '../../components/common/typography/Typography';
import colors from '../../lib/constants/colors';
import { createTrip } from '../../lib/apis/trips';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildPeriodMarks(startDate: string, endDate: string) {
  if (!startDate) return {};

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate || startDate}T00:00:00`);
  const marks: Record<string, object> = {};

  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const key = toDateKey(cursor);
    const isStart = key === startDate;
    const isEnd = key === (endDate || startDate);

    marks[key] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: isStart || isEnd ? colors.forest700 : colors.forest100,
      textColor: isStart || isEnd ? colors.white : colors.forest900,
    };

    cursor.setDate(cursor.getDate() + 1);
  }

  return marks;
}

export default function CreateTripScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    mountainId?: string;
    mountainName?: string;
    mountainRegion?: string;
    mountainHeight?: string;
    mountainImageUrl?: string;
  }>();

  const mountainId = asParam(params.mountainId);
  const mountainName = asParam(params.mountainName);
  const mountainRegion = asParam(params.mountainRegion);
  const mountainHeight = asParam(params.mountainHeight);
  const mountainImageUrl = asParam(params.mountainImageUrl);

  const [title, setTitle] = useState(mountainName ? `${mountainName} 산행` : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const markedDates = useMemo(() => buildPeriodMarks(startDate, endDate), [startDate, endDate]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createTrip({
        title: title.trim() || undefined,
        mountain: {
          externalId: mountainId,
          name: mountainName,
          region: mountainRegion,
          height: mountainHeight ? Number(mountainHeight) : undefined,
          imageUrl: mountainImageUrl || undefined,
        },
        startDate,
        endDate: endDate || startDate,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      Toast.show({ type: 'success', text1: '일정이 생성되었습니다.' });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    },
  });

  const canSubmit =
    mountainId.length > 0 && mountainName.length > 0 && mountainRegion.length > 0 && !!startDate && !isPending;

  function handleDayPress(day: DateData) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate('');
      return;
    }

    if (day.dateString < startDate) {
      setStartDate(day.dateString);
      setEndDate('');
      return;
    }

    setEndDate(day.dateString);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    mutate();
  }

  const dateLabel = startDate
    ? endDate && endDate !== startDate
      ? `${startDate} ~ ${endDate}`
      : startDate
    : '날짜를 선택해주세요';

  return (
    <View style={styles.root}>
      <Header title="일정 만들기" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Typography.HeadingMd>{mountainName || '산'}</Typography.HeadingMd>
            <Typography.Caption color={colors.stone500}>{mountainRegion || '지역 정보 없음'}</Typography.Caption>
          </View>

          <Input label="일정 제목" placeholder={`${mountainName} 산행`} value={title} onChangeText={setTitle} />

          <View style={styles.section}>
            <Typography.Label>일정 날짜</Typography.Label>
            <Typography.BodyBase color={colors.stone700}>{dateLabel}</Typography.BodyBase>
            <Typography.Caption color={colors.stone500}>시작일과 종료일을 순서대로 선택해주세요.</Typography.Caption>
            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                todayTextColor: colors.forest700,
                arrowColor: colors.forest700,
                selectedDayBackgroundColor: colors.forest700,
                textDayFontFamily: 'NotoSansKR_400Regular',
                textMonthFontFamily: 'NotoSansKR_600SemiBold',
                textDayHeaderFontFamily: 'NotoSansKR_500Medium',
              }}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button fullWidth disabled={!canSubmit} loading={isPending} onPress={handleSubmit}>
            일정 만들기
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.stone100,
  },
});
