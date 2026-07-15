import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../typography/Typography';
import colors from '../../../lib/constants/colors';

interface HeaderProps {
  title: string;
  onBack: () => void;
}

function Header({ title, onBack }: HeaderProps) {
  return (
    <View style={styles.container} testID="header">
      <Pressable
        onPress={onBack}
        style={styles.left}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Ionicons name="arrow-back" size={20} color="black" />
      </Pressable>
      <Typography.HeadingMd>{title}</Typography.HeadingMd>
      <View style={styles.right} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone100,
  },
  left: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    width: 32,
    height: 32,
  },
});

export default Header;
