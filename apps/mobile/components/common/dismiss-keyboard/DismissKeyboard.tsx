import { type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export default function DismissKeyboard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable style={[styles.fill, style]} onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
