import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';

import Typography from '../typography/Typography';
import colors from '../../../lib/constants/colors';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onPress: () => void;
}

function Button({
  variant = 'primary',
  size = 'lg',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onPress,
}: ButtonProps) {
  const textColorVariant = {
    primary: colors.white,
    secondary: colors.forest900,
    outline: colors.forest700,
    ghost: colors.stone900,
    danger: colors.white,
  };
  return (
    <TouchableOpacity
      testID="button"
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
    >
      {loading && <ActivityIndicator size="small" color={colors.white} />}
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <Typography.BodyBase color={textColorVariant[variant]}>{children}</Typography.BodyBase>
      {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: 16,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: colors.forest700,
  },
  secondary: {
    backgroundColor: colors.forest100,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.forest700,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.4,
  },
  sm: {
    height: 32,
    paddingHorizontal: 14,
  },
  md: {
    height: 44,
    paddingHorizontal: 20,
  },
  lg: {
    height: 52,
    paddingHorizontal: 24,
  },
  icon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
