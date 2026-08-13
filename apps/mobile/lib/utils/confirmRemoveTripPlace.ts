import { Alert } from 'react-native';

export function confirmRemoveTripPlace(onConfirm: () => void) {
  Alert.alert('일정에서 제거', '이 장소를 일정에서 제거하면 좋아요와 댓글도 함께 사라집니다. 정말 삭제하시겠습니까?', [
    { text: '취소', style: 'cancel' },
    {
      text: '삭제',
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}
