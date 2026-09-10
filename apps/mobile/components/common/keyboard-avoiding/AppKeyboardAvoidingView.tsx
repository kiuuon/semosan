import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_OFFSET = 5;

type AppKeyboardAvoidingViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  extraOffset?: number;
  /** 하단 세이프 에어리어까지 그려진 시트/모달. 기본 화면(SafeAreaView)에서는 켜지 않는다. */
  edgeToBottom?: boolean;
};

export default function AppKeyboardAvoidingView({
  children,
  style,
  extraOffset = 0,
  edgeToBottom = false,
}: AppKeyboardAvoidingViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior="padding"
      keyboardVerticalOffset={DEFAULT_OFFSET + (edgeToBottom ? 0 : insets.bottom) + extraOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
