import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Typography from '../typography/Typography';
import colors from '../../../lib/constants/colors';

interface ProgressBarProps {
  totalSteps: number;
  currentStep: number;
  currentStepName: string;
}

function ProgressBar({ totalSteps, currentStep, currentStepName }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps - 1 }).map((_, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={[styles.stepBlock, index + 1 <= currentStep ? styles.stepBlockActive : null]}>
            {index + 1 < currentStep ? (
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
            ) : (
              <Typography.Label color={index + 1 === currentStep ? colors.white : colors.stone300}>
                {index + 1}
              </Typography.Label>
            )}
          </View>
          <View style={styles.stepSeparator} />
        </View>
      ))}
      <View style={[styles.stepBlock, totalSteps === currentStep ? styles.stepBlockActive : null]}>
        <Typography.Label color={totalSteps === currentStep ? colors.white : colors.stone300}>
          {totalSteps}
        </Typography.Label>
      </View>
      <Typography.Caption color={colors.stone500} style={{ marginLeft: 8 }}>
        {currentStepName}
      </Typography.Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBlock: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.stone100,
    marginRight: 8,
  },
  stepBlockActive: {
    backgroundColor: colors.forest900,
  },
  stepSeparator: {
    width: 40,
    height: 2,
    backgroundColor: colors.stone100,
    marginRight: 8,
  },
});

export default ProgressBar;
