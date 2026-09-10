import { type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export default function DismissKeyboard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.fill, style]} accessible={false}>
      <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} accessible={false} />
      <View style={styles.fill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
