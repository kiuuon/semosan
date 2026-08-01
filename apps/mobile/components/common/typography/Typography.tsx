import { Text, type TextProps, type TextStyle } from 'react-native';
import colors from '../../../lib/constants/colors';

type ColorType = (typeof colors)[keyof typeof colors];

interface TypographyProps extends TextProps {
  color?: ColorType;
  /** true면 1줄, 숫자를 주면 해당 줄 수에서 ... 처리 */
  ellipsis?: boolean | number;
}

function createTypography(variantStyle: TextStyle, displayName: string) {
  function TypographyVariant({ style, color, ellipsis, numberOfLines, ellipsizeMode, ...props }: TypographyProps) {
    const ellipsisLines = ellipsis === true ? 1 : typeof ellipsis === 'number' ? ellipsis : undefined;

    return (
      <Text
        allowFontScaling={false}
        style={[variantStyle, { color: color ?? colors.stone900 }, style]}
        numberOfLines={numberOfLines ?? ellipsisLines}
        ellipsizeMode={ellipsizeMode ?? (ellipsisLines != null ? 'tail' : undefined)}
        {...props}
      />
    );
  }

  TypographyVariant.displayName = `Typography.${displayName}`;
  return TypographyVariant;
}

const Typography = {
  /** 앱 로고, 히어로 타이틀 */
  Display: createTypography(
    {
      fontFamily: 'NotoSansKR_800ExtraBold',
      fontSize: 28,
      lineHeight: 28 * 1.2,
      letterSpacing: 28 * -0.02,
    },
    'Display',
  ),
  /** 페이지 타이틀 */
  HeadingXl: createTypography(
    {
      fontFamily: 'NotoSansKR_700Bold',
      fontSize: 22,
      lineHeight: 22 * 1.2,
      letterSpacing: 22 * -0.02,
    },
    'HeadingXl',
  ),
  /** 섹션 헤딩 */
  HeadingLg: createTypography(
    {
      fontFamily: 'NotoSansKR_700Bold',
      fontSize: 18,
      lineHeight: 18 * 1.4,
      letterSpacing: 0,
    },
    'HeadingLg',
  ),
  /** 카드 타이틀 */
  HeadingMd: createTypography(
    {
      fontFamily: 'NotoSansKR_600SemiBold',
      fontSize: 16,
      lineHeight: 16 * 1.4,
      letterSpacing: 0,
    },
    'HeadingMd',
  ),
  /** 일반 본문 */
  BodyBase: createTypography(
    {
      fontFamily: 'NotoSansKR_400Regular',
      fontSize: 14,
      lineHeight: 14 * 1.6,
      letterSpacing: 0,
    },
    'BodyBase',
  ),
  /** 강조 본문, 버튼 */
  BodyMedium: createTypography(
    {
      fontFamily: 'NotoSansKR_500Medium',
      fontSize: 14,
      lineHeight: 14 * 1.6,
      letterSpacing: 0,
    },
    'BodyMedium',
  ),
  /** 메타 정보, 날짜, 거리 */
  Caption: createTypography(
    {
      fontFamily: 'NotoSansKR_400Regular',
      fontSize: 12,
      lineHeight: 12 * 1.4,
      letterSpacing: 0,
    },
    'Caption',
  ),
  /** 배지, 태그, 상태 레이블 */
  Label: createTypography(
    {
      fontFamily: 'NotoSansKR_700Bold',
      fontSize: 12,
      lineHeight: 12 * 1.4,
      letterSpacing: 12 * 0.1,
    },
    'Label',
  ),
  /** 고도·거리·시간 수치 */
  DataMono: createTypography(
    {
      fontFamily: 'DMMono_500Medium',
      fontSize: 12,
      lineHeight: 12 * 1.4,
      letterSpacing: 0,
    },
    'DataMono',
  ),
};

export type { TypographyProps };
export default Typography;
