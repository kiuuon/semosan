import { render, screen } from '@testing-library/react-native';

import Typography from './Typography';

const variants = [
  {
    name: 'Display',
    Component: Typography.Display,
    style: {
      fontFamily: 'NotoSansKR_800ExtraBold',
      fontSize: 28,
      lineHeight: 28 * 1.2,
      letterSpacing: 28 * -0.02,
    },
  },
  {
    name: 'HeadingXl',
    Component: Typography.HeadingXl,
    style: {
      fontFamily: 'NotoSansKR_700Bold',
      fontSize: 22,
      lineHeight: 22 * 1.2,
      letterSpacing: 22 * -0.02,
    },
  },
  {
    name: 'HeadingLg',
    Component: Typography.HeadingLg,
    style: {
      fontFamily: 'NotoSansKR_700Bold',
      fontSize: 18,
      lineHeight: 18 * 1.4,
      letterSpacing: 0,
    },
  },
  {
    name: 'HeadingMd',
    Component: Typography.HeadingMd,
    style: {
      fontFamily: 'NotoSansKR_600SemiBold',
      fontSize: 16,
      lineHeight: 16 * 1.4,
      letterSpacing: 0,
    },
  },
  {
    name: 'BodyBase',
    Component: Typography.BodyBase,
    style: {
      fontFamily: 'NotoSansKR_400Regular',
      fontSize: 14,
      lineHeight: 14 * 1.6,
      letterSpacing: 0,
    },
  },
  {
    name: 'BodyMedium',
    Component: Typography.BodyMedium,
    style: {
      fontFamily: 'NotoSansKR_500Medium',
      fontSize: 14,
      lineHeight: 14 * 1.6,
      letterSpacing: 0,
    },
  },
  {
    name: 'Caption',
    Component: Typography.Caption,
    style: {
      fontFamily: 'NotoSansKR_400Regular',
      fontSize: 12,
      lineHeight: 12 * 1.4,
      letterSpacing: 0,
    },
  },
  {
    name: 'Label',
    Component: Typography.Label,
    style: {
      fontFamily: 'NotoSansKR_700Bold',
      fontSize: 12,
      lineHeight: 12 * 1.4,
      letterSpacing: 12 * 0.1,
    },
  },
  {
    name: 'DataMono',
    Component: Typography.DataMono,
    style: {
      fontFamily: 'DMMono_500Medium',
      fontSize: 12,
      lineHeight: 12 * 1.4,
      letterSpacing: 0,
    },
  },
] as const;

describe('Typography', () => {
  it.each(variants)('$name 텍스트와 variant 스타일을 렌더한다', async ({ Component, style }) => {
    await render(<Component>세모산</Component>);

    const text = screen.getByText('세모산');
    expect(text).toBeOnTheScreen();
    expect(text).toHaveStyle(style);
    expect(text.props.allowFontScaling).toBe(false);
  });

  it('style prop을 variant 스타일 위에 병합한다', async () => {
    await render(<Typography.BodyBase style={{ color: '#1B4332' }}>본문</Typography.BodyBase>);

    expect(screen.getByText('본문')).toHaveStyle({
      fontFamily: 'NotoSansKR_400Regular',
      fontSize: 14,
      color: '#1B4332',
    });
  });

  it('Text props를 전달한다', async () => {
    await render(
      <Typography.Caption numberOfLines={1} accessibilityLabel="거리">
        1.2km
      </Typography.Caption>,
    );

    const text = screen.getByLabelText('거리');
    expect(text).toHaveTextContent('1.2km');
    expect(text.props.numberOfLines).toBe(1);
  });

  it('ellipsis가 true면 1줄에서 ... 처리한다', async () => {
    await render(<Typography.BodyBase ellipsis>긴 텍스트</Typography.BodyBase>);

    const text = screen.getByText('긴 텍스트');
    expect(text.props.numberOfLines).toBe(1);
    expect(text.props.ellipsizeMode).toBe('tail');
  });

  it('ellipsis에 숫자를 주면 해당 줄 수에서 ... 처리한다', async () => {
    await render(<Typography.Caption ellipsis={2}>긴 텍스트</Typography.Caption>);

    const text = screen.getByText('긴 텍스트');
    expect(text.props.numberOfLines).toBe(2);
    expect(text.props.ellipsizeMode).toBe('tail');
  });
});
