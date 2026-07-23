import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import Typography from '../typography/Typography';
import colors from '../../../lib/constants/colors';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

function Header({ title, onBack = () => router.back() }: HeaderProps) {
  return (
    <View style={styles.container} testID="header">
      <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="뒤로가기">
        <Ionicons name="chevron-back" size={24} />
      </Pressable>
      <Typography.HeadingLg>{title}</Typography.HeadingLg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone100,
  },
});

export default Header;
