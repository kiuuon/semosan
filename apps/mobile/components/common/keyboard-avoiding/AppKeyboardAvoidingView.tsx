import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_OFFSET = 5;

type AppKeyboardAvoidingViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  extraOffset?: number;
};

export default function AppKeyboardAvoidingView({ children, style, extraOffset = 0 }: AppKeyboardAvoidingViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior="padding"
      keyboardVerticalOffset={DEFAULT_OFFSET + insets.bottom + extraOffset}
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
