import { StyleSheet, View } from 'react-native';

import Typography from '../../common/Typography/Typography';
import colors from '../../../lib/constants/colors';

interface PasswordRequirementsProps {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
}

function PasswordRequirements({ hasMinLength, hasLetter, hasNumber }: PasswordRequirementsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.requirement}>
        <View style={[styles.dot, hasMinLength && styles.activeDot]} />
        {hasMinLength ? (
          <Typography.Label color={colors.forest900}>8자 이상</Typography.Label>
        ) : (
          <Typography.Caption color={colors.stone300}>8자 이상</Typography.Caption>
        )}
      </View>
      <View style={styles.requirement}>
        <View style={[styles.dot, hasLetter && styles.activeDot]} />
        {hasLetter ? (
          <Typography.Label color={colors.forest900}>영문 포함</Typography.Label>
        ) : (
          <Typography.Caption color={colors.stone300}>영문 포함</Typography.Caption>
        )}
      </View>
      <View style={styles.requirement}>
        <View style={[styles.dot, hasNumber && styles.activeDot]} />
        {hasNumber ? (
          <Typography.Label color={colors.forest900}>숫자 포함</Typography.Label>
        ) : (
          <Typography.Caption color={colors.stone300}>숫자 포함</Typography.Caption>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.stone300,
  },
  activeDot: {
    backgroundColor: colors.forest900,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default PasswordRequirements;
