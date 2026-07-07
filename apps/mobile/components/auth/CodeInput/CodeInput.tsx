import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import colors from '../../../lib/constants/colors';

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  length?: number;
}

function CodeInput({ value, onChange, length = 6 }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  function handleChangeText(text: string) {
    onChange(text.replace(/\D/g, '').slice(0, length));
  }

  return (
    <Pressable style={styles.container} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? '';
        const isActiveCell = isFocused && (index === value.length || (value.length === length && index === length - 1));

        return (
          <View key={index} style={[styles.cell, isActiveCell && styles.cellFocused]}>
            <Text style={styles.cellText}>{digit}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        caretHidden
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        accessibilityLabel="인증 코드 입력"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: colors.stone300,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFocused: {
    borderColor: colors.forest700,
  },
  cellText: {
    fontSize: 20,
    fontFamily: 'DMMono_500Medium',
    color: colors.stone900,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});

export default CodeInput;
