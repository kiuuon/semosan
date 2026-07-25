import React from 'react';
import { View, StyleSheet } from 'react-native';
import Typography from '../typography/Typography';
import colors from '../../../lib/constants/colors';

const DividerLine = ({
  color,
  thickness,
  strokeType,
}: {
  color: string;
  thickness: number;
  strokeType: 'dashed' | 'dotted' | 'solid';
}) => <View style={[styles.line, { borderColor: color, borderTopWidth: thickness, borderStyle: strokeType }]} />;

interface DividerProps {
  color?: string;
  thickness?: number;
  marginVertical?: number;
  text?: string;
  textColor?: string;
  textPosition?: 'left' | 'center' | 'right';
  strokeType?: 'dashed' | 'dotted' | 'solid';
}

const Divider = ({
  color = colors.stone300,
  thickness = 1,
  marginVertical = 1,
  text,
  textColor = colors.stone500,
  textPosition = 'center',
  strokeType = 'solid',
}: DividerProps) => {
  if (text) {
    if (textPosition === 'left') {
      return (
        <View style={[styles.container, { marginVertical }]}>
          <View style={{ paddingRight: 12 }}>
            <Typography.BodyBase color={textColor}>{text}</Typography.BodyBase>
          </View>
          <DividerLine color={color} thickness={thickness} strokeType={strokeType} />
        </View>
      );
    }

    if (textPosition === 'right') {
      return (
        <View style={[styles.container, { marginVertical }]}>
          <DividerLine color={color} thickness={thickness} strokeType={strokeType} />
          <View style={{ paddingLeft: 12 }}>
            <Typography.BodyBase color={textColor}>{text}</Typography.BodyBase>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, { marginVertical }]}>
        <DividerLine color={color} thickness={thickness} strokeType={strokeType} />
        <View style={{ paddingHorizontal: 12 }}>
          <Typography.BodyBase color={textColor}>{text}</Typography.BodyBase>
        </View>
        <DividerLine color={color} thickness={thickness} strokeType={strokeType} />
      </View>
    );
  }

  return (
    <View style={{ marginVertical }}>
      <DividerLine color={color} thickness={thickness} strokeType={strokeType} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
  },
});

export default Divider;
