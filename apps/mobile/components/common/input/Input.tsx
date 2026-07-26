import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../../lib/constants/colors';
import Typography from '../typography/Typography';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  accessoryLeft?: ReactNode;
  accessoryRight?: ReactNode;
  status?: 'default' | 'active' | 'error';
  caption?: string;
  secureTextEntry?: boolean;
}

const borderColorByStatus = {
  default: colors.stone300,
  active: colors.forest700,
  error: colors.danger,
} as const;

const Input = ({
  placeholder,
  label,
  size = 'large',
  accessoryLeft,
  accessoryRight,
  status = 'default',
  onChangeText,
  value,
  caption,
  secureTextEntry = false,
}: InputProps) => {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);

  return (
    <View style={styles.inputContainer}>
      {label && <Typography.Label>{label}</Typography.Label>}
      <View style={[styles.input, styles[size], { borderColor: borderColorByStatus[status] }]}>
        {accessoryLeft ? <View style={styles.accessoryLeft}>{accessoryLeft}</View> : null}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={colors.stone300}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !isSecureTextVisible}
          onChangeText={onChangeText}
          value={value}
        />
        {secureTextEntry ? (
          <Pressable
            style={styles.secureToggle}
            onPress={() => setIsSecureTextVisible((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isSecureTextVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
          >
            <MaterialIcons
              name={isSecureTextVisible ? 'visibility' : 'visibility-off'}
              size={16}
              color={colors.stone500}
            />
          </Pressable>
        ) : null}
        {accessoryRight ? <View style={styles.accessoryRight}>{accessoryRight}</View> : null}
      </View>
      {caption && (
        <Typography.Caption
          color={status === 'error' ? colors.danger : status === 'active' ? colors.forest700 : colors.stone500}
        >
          {caption}
        </Typography.Caption>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    gap: 6,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansKR_400Regular',
    color: colors.stone900,
  },
  accessoryLeft: {
    marginRight: 8,
  },
  secureToggle: {
    marginLeft: 8,
  },
  accessoryRight: {
    marginLeft: 8,
  },
  small: {
    height: 36,
  },
  medium: {
    height: 44,
  },
  large: {
    height: 52,
  },
});

export default Input;
