import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, type DateData } from 'react-native-calendars';
import Toast from 'react-native-toast-message';

import Button from '../../../components/common/button/Button';
import Divider from '../../../components/common/divider/Divider';
import Input from '../../../components/common/input/Input';
import Typography from '../../../components/common/typography/Typography';
import { deleteTrip, getTrip, updateTrip } from '../../../lib/apis/trips';
import { getMe } from '../../../lib/apis/auth';
import colors from '../../../lib/constants/colors';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function toDateKey(value: string | Date) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatPeriod(startDate: string, endDate: string) {
  const start = toDateKey(startDate);
  const end = toDateKey(endDate);
  return start === end ? start : `${start} ~ ${end}`;
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

export default function TripSettingsScreen() {
  const queryClient = useQueryClient();
  const localParams = useLocalSearchParams<{ id?: string }>();
  const globalParams = useGlobalSearchParams<{ id?: string }>();
  const tripId = asParam(localParams.id) || asParam(globalParams.id);

  const [isEditing, setIsEditing] = useState(false);
  const [isInviteCodeVisible, setIsInviteCodeVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const {
    data: trip,
    isLoading,
    isError,
    isFetched,
  } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId),
    enabled: tripId.length > 0,
  });

  const isOwner = !!me && !!trip && me._id === trip.ownerId;
  const markedDates = useMemo(() => buildPeriodMarks(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (!trip || isEditing) return;
    setTitle(trip.title ?? '');
    setStartDate(toDateKey(trip.startDate));
    setEndDate(toDateKey(trip.endDate));
  }, [trip, isEditing]);

  const { mutate: mutateUpdate, isPending: isUpdatePending } = useMutation({
    mutationFn: () =>
      updateTrip(tripId, {
        title: title.trim(),
        startDate,
        endDate: endDate || startDate,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trip', tripId] }),
        queryClient.invalidateQueries({ queryKey: ['trips'] }),
      ]);
      setIsEditing(false);
      Toast.show({ type: 'success', text1: '여정이 수정되었습니다.' });
    },
  });

  const { mutate: mutateDelete, isPending: isDeletePending } = useMutation({
    mutationFn: () => deleteTrip(tripId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.removeQueries({ queryKey: ['trip', tripId] });
      Toast.show({ type: 'success', text1: '여정이 삭제되었습니다.' });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    },
  });

  const canSubmit = !!title.trim() && !!startDate && !isUpdatePending;

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

  function handleStartEdit() {
    if (!trip) return;
    setTitle(trip.title ?? '');
    setStartDate(toDateKey(trip.startDate));
    setEndDate(toDateKey(trip.endDate));
    setIsEditing(true);
  }

  function handleCancelEdit() {
    if (!trip) return;
    setTitle(trip.title ?? '');
    setStartDate(toDateKey(trip.startDate));
    setEndDate(toDateKey(trip.endDate));
    setIsEditing(false);
  }

  function handleDelete() {
    if (isDeletePending) return;

    Alert.alert('여정 삭제', '정말 이 여정을 삭제하시겠습니까?', [
      { text: '취소' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => mutateDelete(),
      },
    ]);
  }

  async function handleCopyInviteCode() {
    if (!trip?.inviteCode) return;
    await Clipboard.setStringAsync(trip.inviteCode);
    Toast.show({ type: 'success', text1: '초대코드가 복사되었습니다.' });
  }

  async function handleShareInviteCode() {
    if (!trip?.inviteCode) return;

    const tripTitle = trip.title || trip.mountain.name;
    await Share.share({
      message: `[세모산] ${tripTitle} 초대코드: ${trip.inviteCode}`,
    });
  }

  if (!tripId || isLoading || (!trip && !isError && !isFetched)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest700} />
      </View>
    );
  }

  if (isError || !trip) {
    return (
      <View style={styles.centered}>
        <Typography.BodyBase color={colors.stone500}>여정 정보를 불러오지 못했습니다.</Typography.BodyBase>
      </View>
    );
  }

  const dateLabel = startDate
    ? endDate && endDate !== startDate
      ? `${startDate} ~ ${endDate}`
      : startDate
    : '날짜를 선택해주세요';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Typography.HeadingMd>설정</Typography.HeadingMd>

        {isEditing ? (
          <View style={styles.section}>
            <Input label="일정 제목" value={title} onChangeText={setTitle} placeholder="일정 제목" />
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
            <View style={styles.actions}>
              <Button fullWidth variant="outline" disabled={isUpdatePending} onPress={handleCancelEdit}>
                취소
              </Button>
              <Button fullWidth disabled={!canSubmit} loading={isUpdatePending} onPress={() => mutateUpdate()}>
                저장
              </Button>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <InfoRow label="여정 이름" value={trip.title || '제목 없음'} />
              <InfoRow label="기간" value={formatPeriod(trip.startDate, trip.endDate)} />
              <InfoRow label="산 이름" value={trip.mountain.name} />
              <View style={styles.membersBlock}>
                <Typography.Caption color={colors.stone500}>참여 멤버</Typography.Caption>
                <Typography.BodyBase color={colors.stone900}>
                  {trip.members.map((member) => member.nickname).join(', ') || '없음'}
                </Typography.BodyBase>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setIsInviteCodeVisible(true)}>
                <Typography.BodyBase color={colors.forest700}>초대코드 확인하기</Typography.BodyBase>
              </TouchableOpacity>
            </View>

            {isOwner && (
              <>
                <Divider marginVertical={8} color={colors.stone100} />
                <View style={styles.actions}>
                  <Button fullWidth variant="outline" onPress={handleStartEdit}>
                    여정 수정
                  </Button>
                  <Button fullWidth variant="danger" loading={isDeletePending} onPress={handleDelete}>
                    여정 삭제
                  </Button>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={isInviteCodeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsInviteCodeVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsInviteCodeVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Typography.HeadingMd>초대코드</Typography.HeadingMd>
            <Typography.Caption color={colors.stone500}>
              친구에게 이 코드를 공유해 여정에 초대하세요.
            </Typography.Caption>
            <View style={styles.inviteCodeBox}>
              <Typography.DataMonoLg color={colors.forest700}>{trip.inviteCode}</Typography.DataMonoLg>
            </View>
            <View style={styles.actions}>
              <View style={styles.copyShareActions}>
                <View style={{ flex: 1 }}>
                  <Button variant="outline" fullWidth onPress={handleCopyInviteCode}>
                    복사하기
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button fullWidth onPress={handleShareInviteCode}>
                    공유하기
                  </Button>
                </View>
              </View>
              <Button fullWidth variant="ghost" onPress={() => setIsInviteCodeVisible(false)}>
                닫기
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Typography.Caption color={colors.stone500}>{label}</Typography.Caption>
      <Typography.BodyBase color={colors.stone900}>{value}</Typography.BodyBase>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 20,
  },
  section: {
    gap: 16,
  },
  infoRow: {
    gap: 4,
  },
  membersBlock: {
    gap: 4,
  },
  actions: {
    gap: 12,
  },
  copyShareActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(26, 26, 24, 0.45)',
  },
  modalCard: {
    gap: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  inviteCodeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.forest50,
  },
});
