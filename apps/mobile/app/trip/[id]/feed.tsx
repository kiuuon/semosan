import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import FeedPostCommentsModal from '../../../components/trip/feed/FeedPostCommentsModal';
import FeedPostComposeModal from '../../../components/trip/feed/FeedPostComposeModal';
import TripFeedPostCard from '../../../components/trip/feed/TripFeedPostCard';
import Typography from '../../../components/common/typography/Typography';
import { getMe } from '../../../lib/apis/auth';
import {
  getTripFeedPosts,
  removeTripFeedPost,
  toggleTripFeedPostLike,
  type TripFeedPost,
} from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function TripFeedScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = asParam(params.id);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TripFeedPost | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const {
    data: posts = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['trip', tripId, 'posts'],
    queryFn: () => getTripFeedPosts(tripId),
    enabled: tripId.length > 0,
  });

  const { mutate: toggleLike } = useMutation({
    mutationFn: (postId: string) => toggleTripFeedPostLike(tripId, postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['trip', tripId, 'posts'] });
      const previous = queryClient.getQueryData<TripFeedPost[]>(['trip', tripId, 'posts']);
      const userId = me?._id;

      if (previous && userId) {
        queryClient.setQueryData<TripFeedPost[]>(['trip', tripId, 'posts'], (current) =>
          (current ?? []).map((post) => {
            if (post._id !== postId) {
              return post;
            }
            const liked = post.likedUserIds.includes(userId);
            return {
              ...post,
              likedUserIds: liked ? post.likedUserIds.filter((id) => id !== userId) : [...post.likedUserIds, userId],
            };
          }),
        );
      }

      return { previous };
    },
    onError: (_error, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['trip', tripId, 'posts'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'posts'] });
    },
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: (postId: string) => removeTripFeedPost(tripId, postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'posts'] });
    },
  });

  const handleDeletePost = (post: TripFeedPost) => {
    Alert.alert('글 삭제', '이 글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deletePost(post._id),
      },
    ]);
  };

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
        <Typography.BodyBase color={colors.stone500}>피드를 불러오지 못했습니다.</Typography.BodyBase>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, posts.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.stone300} />
            <Typography.HeadingMd>아직 올라온 글이 없어요</Typography.HeadingMd>
            <Typography.BodyBase color={colors.stone500}>+ 버튼으로 첫 글을 남겨 보세요.</Typography.BodyBase>
          </View>
        }
        renderItem={({ item }) => (
          <TripFeedPostCard
            post={item}
            liked={me?._id ? item.likedUserIds.includes(me._id) : false}
            isMine={me?._id === item.authorId}
            onToggleLike={() => toggleLike(item._id)}
            onPressComment={() => setSelectedPost(item)}
            onDelete={() => handleDeletePost(item)}
          />
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => setIsComposeOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="글 작성"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      <FeedPostComposeModal visible={isComposeOpen} tripId={tripId} onClose={() => setIsComposeOpen(false)} />

      {selectedPost ? (
        <FeedPostCommentsModal
          visible
          tripId={tripId}
          postId={selectedPost._id}
          authorNickname={selectedPost.authorNickname}
          onClose={() => setSelectedPost(null)}
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
    flexGrow: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.forest700,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.stone900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
});
