import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../../common/typography/Typography';
import type { TripFeedPost } from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';

interface TripFeedPostCardProps {
  post: TripFeedPost;
  liked: boolean;
  isMine: boolean;
  onToggleLike: () => void;
  onPressComment: () => void;
  onDelete?: () => void;
}

function formatPostTime(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (date.toDateString() === now.toDateString()) {
    return time;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}.${date.getDate()} ${time}`;
  }

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${time}`;
}

function TripFeedPostCard({ post, liked, isMine, onToggleLike, onPressComment, onDelete }: TripFeedPostCardProps) {
  const avatarLabel = post.authorNickname.trim().charAt(0) || '?';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.author}>
          <View style={styles.avatar}>
            <Typography.Label color={colors.forest700}>{avatarLabel}</Typography.Label>
          </View>
          <View style={styles.authorMeta}>
            <Typography.BodyMedium>{post.authorNickname}</Typography.BodyMedium>
            <Typography.Caption color={colors.stone500}>{formatPostTime(post.createdAt)}</Typography.Caption>
          </View>
        </View>

        {isMine && onDelete ? (
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="글 삭제">
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.stone500} />
          </Pressable>
        ) : null}
      </View>

      <Typography.BodyBase color={colors.stone900} style={styles.content}>
        {post.content}
      </Typography.BodyBase>

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
          {post.likedUserIds.length > 0 ? (
            <Typography.Caption color={liked ? colors.summit700 : colors.stone700}>
              {post.likedUserIds.length}
            </Typography.Caption>
          ) : null}
        </Pressable>

        <Pressable
          style={styles.action}
          onPress={onPressComment}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="댓글"
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.stone700} />
          {post.commentCount > 0 ? (
            <Typography.Caption color={colors.stone700}>{post.commentCount}</Typography.Caption>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  author: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorMeta: {
    flex: 1,
    gap: 2,
  },
  content: {
    paddingLeft: 46,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 46,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default TripFeedPostCard;
