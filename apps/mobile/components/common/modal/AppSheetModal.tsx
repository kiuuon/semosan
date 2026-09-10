import { type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '../../../lib/constants/colors';

type AppSheetModalProps = {
  visible: boolean;
  children: ReactNode;
  onRequestClose: () => void;
};

const ANDROID_SHEET_GAP = 12;

export default function AppSheetModal({ visible, children, onRequestClose }: AppSheetModalProps) {
  if (Platform.OS === 'ios') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onRequestClose}>
        <SafeAreaProvider style={styles.fill}>{children}</SafeAreaProvider>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}
    >
      <SafeAreaProvider style={styles.fill}>
        <AndroidSheet onRequestClose={onRequestClose}>{children}</AndroidSheet>
      </SafeAreaProvider>
    </Modal>
  );
}

function AndroidSheet({ children, onRequestClose }: { children: ReactNode; onRequestClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.androidRoot}>
      <Pressable style={styles.androidBackdrop} onPress={onRequestClose} accessibilityRole="button" accessibilityLabel="닫기" />
      <View style={[styles.androidSheet, { marginTop: insets.top + ANDROID_SHEET_GAP }]}>
        <SafeAreaProvider style={styles.fill}>{children}</SafeAreaProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  androidRoot: {
    flex: 1,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  androidSheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
});
