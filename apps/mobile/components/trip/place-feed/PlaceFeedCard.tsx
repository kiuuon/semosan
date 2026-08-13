import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../../common/typography/Typography';
import type { TripPlace } from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';

interface PlaceFeedCardProps {
  place: TripPlace;
  liked: boolean;
  onPress: () => void;
  onToggleLike: () => void;
  onPressComment: () => void;
}

function PlaceFeedCard({ place, liked, onPress, onToggleLike, onPressComment }: PlaceFeedCardProps) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${place.name} 상세 보기`}>
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image" size={36} color={colors.stone300} />
          </View>
        )}

        <View style={styles.info}>
          <Typography.HeadingMd ellipsis>{place.name}</Typography.HeadingMd>
          <Typography.Caption color={colors.stone500} ellipsis>
            {place.address?.trim() || '위치 정보 없음'}
          </Typography.Caption>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={styles.action}
          onPress={onToggleLike}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.summit700 : colors.stone700}
          />
          <Typography.Caption color={liked ? colors.summit700 : colors.stone700}>
            {place.likedUserIds.length}
          </Typography.Caption>
        </Pressable>

        <Pressable
          style={styles.action}
          onPress={onPressComment}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="댓글"
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.stone700} />
          <Typography.Caption color={colors.stone700}>{place.commentCount}</Typography.Caption>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.stone100,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default PlaceFeedCard;
