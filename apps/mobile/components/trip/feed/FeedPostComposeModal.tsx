import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../../common/typography/Typography';
import { createTripFeedPost } from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';

interface FeedPostComposeModalProps {
  visible: boolean;
  tripId: string;
  onClose: () => void;
}

function FeedPostComposeModal({ visible, tripId, onClose }: FeedPostComposeModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { mutate: submitPost, isPending: isSubmitting } = useMutation({
    mutationFn: () => createTripFeedPost(tripId, content),
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'posts'] });
      onClose();
    },
  });

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    setContent('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.headerText}>
            <Typography.HeadingLg ellipsis>여정 공유</Typography.HeadingLg>
            <Typography.Caption color={colors.stone500}>여정에서 있었던 일을 남겨 보세요</Typography.Caption>
          </View>
          <Pressable onPress={handleClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="닫기">
            <Ionicons name="close" size={24} color={colors.stone700} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="무슨 일이 있었나요?"
            placeholderTextColor={colors.stone300}
            multiline
            maxLength={2000}
            autoFocus
          />
        </View>

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Typography.Caption color={colors.stone500}>{content.length}/2000</Typography.Caption>
          <Pressable
            onPress={() => submitPost()}
            disabled={!canSubmit}
            style={[styles.sendButton, !canSubmit && styles.sendButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="글 등록"
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 16 * 1.6,
    fontFamily: 'NotoSansKR_400Regular',
    color: colors.stone900,
    textAlignVertical: 'top',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.stone100,
    backgroundColor: colors.white,
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

export default FeedPostComposeModal;
