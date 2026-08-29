import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../../common/typography/Typography';
import { getMe } from '../../../lib/apis/auth';
import {
  addTripFeedPostComment,
  getTripFeedPostComments,
  removeTripFeedPostComment,
  type TripFeedPostComment,
} from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';

interface FeedPostCommentsModalProps {
  visible: boolean;
  tripId: string;
  postId: string;
  authorNickname: string;
  onClose: () => void;
}

function formatCommentTime(value: string) {
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

function FeedPostCommentsModal({ visible, tripId, postId, authorNickname, onClose }: FeedPostCommentsModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: visible,
  });

  const { data: comments = [], isPending } = useQuery({
    queryKey: ['trip', tripId, 'posts', postId, 'comments'],
    queryFn: () => getTripFeedPostComments(tripId, postId),
    enabled: visible && tripId.length > 0 && postId.length > 0,
  });

  const invalidateComments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'posts', postId, 'comments'] }),
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'posts'] }),
    ]);
  };

  const { mutate: submitComment, isPending: isSubmitting } = useMutation({
    mutationFn: () => addTripFeedPostComment(tripId, postId, content),
    onSuccess: async () => {
      setContent('');
      await invalidateComments();
    },
  });

  const { mutate: deleteComment, isPending: isDeleting } = useMutation({
    mutationFn: (commentId: string) => removeTripFeedPostComment(tripId, postId, commentId),
    onSuccess: async () => {
      await invalidateComments();
    },
  });

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  const handleDelete = (comment: TripFeedPostComment) => {
    Alert.alert('댓글 삭제', '이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteComment(comment._id),
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.headerText}>
            <Typography.HeadingLg ellipsis>댓글</Typography.HeadingLg>
            <Typography.Caption color={colors.stone500} ellipsis>
              {authorNickname}의 글
            </Typography.Caption>
          </View>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="닫기">
            <Ionicons name="close" size={24} color={colors.stone700} />
          </Pressable>
        </View>

        {isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.forest700} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Typography.BodyBase color={colors.stone500}>아직 댓글이 없습니다.</Typography.BodyBase>
              </View>
            }
            renderItem={({ item }) => {
              const isMine = me?._id === item.userId;

              return (
                <View style={styles.comment}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentMeta}>
                      <Typography.Label>{item.nickname}</Typography.Label>
                      <Typography.Label color={colors.stone500}>{formatCommentTime(item.createdAt)}</Typography.Label>
                    </View>

                    {isMine ? (
                      <Pressable
                        onPress={() => handleDelete(item)}
                        disabled={isDeleting}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="댓글 삭제"
                      >
                        <Typography.Caption color={colors.stone500}>삭제</Typography.Caption>
                      </Pressable>
                    ) : null}
                  </View>
                  <Typography.BodyBase color={colors.stone700}>{item.content}</Typography.BodyBase>
                </View>
              );
            }}
          />
        )}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="댓글을 입력하세요"
            placeholderTextColor={colors.stone300}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={() => submitComment()}
            disabled={!canSubmit}
            style={[styles.sendButton, !canSubmit && styles.sendButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="댓글 등록"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={colors.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone100,
    gap: 16,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 32,
    flexGrow: 1,
  },
  comment: {
    gap: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.stone100,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.stone100,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'NotoSansKR_400Regular',
    color: colors.stone900,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forest700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

export default FeedPostCommentsModal;
