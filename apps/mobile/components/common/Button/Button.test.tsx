import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import colors from '../../../lib/constants/colors';

import Button from './Button';

describe('Button', () => {
  it('children을 렌더한다', async () => {
    await render(
      <Button variant="primary" size="lg" onPress={jest.fn()}>
        확인
      </Button>,
    );

    expect(screen.getByText('확인')).toBeOnTheScreen();
  });

  it('기본 variant는 primary이고 lg 높이를 사용한다', async () => {
    await render(
      <Button variant="primary" size="lg" onPress={jest.fn()}>
        확인
      </Button>,
    );

    expect(screen.getByTestId('button')).toHaveStyle({
      backgroundColor: colors.forest700,
      height: 52,
      alignSelf: 'flex-start',
    });
  });

  it.each([
    ['primary', { backgroundColor: colors.forest700 }, colors.white],
    ['secondary', { backgroundColor: colors.forest100 }, colors.forest900],
    ['outline', { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.forest700 }, colors.forest700],
    ['ghost', { backgroundColor: 'transparent' }, colors.stone900],
    ['danger', { backgroundColor: colors.danger }, colors.white],
  ] as const)('%s variant 스타일과 텍스트 색상을 적용한다', async (variant, style, textColor) => {
    await render(
      <Button variant={variant} size="lg" onPress={jest.fn()}>
        확인
      </Button>,
    );

    expect(screen.getByTestId('button')).toHaveStyle(style);
    expect(screen.getByText('확인')).toHaveStyle({ color: textColor });
  });

  it.each([
    ['sm', { height: 32, paddingHorizontal: 14 }],
    ['md', { height: 44, paddingHorizontal: 20 }],
    ['lg', { height: 52, paddingHorizontal: 24 }],
  ] as const)('%s size 스타일을 적용한다', async (size, style) => {
    await render(
      <Button variant="primary" size={size} onPress={jest.fn()}>
        확인
      </Button>,
    );

    expect(screen.getByTestId('button')).toHaveStyle(style);
  });

  it('leftIcon과 rightIcon을 렌더한다', async () => {
    await render(
      <Button variant="primary" size="lg" leftIcon={<Text>L</Text>} rightIcon={<Text>R</Text>} onPress={jest.fn()}>
        확인
      </Button>,
    );

    expect(screen.getByText('L')).toBeOnTheScreen();
    expect(screen.getByText('R')).toBeOnTheScreen();
    expect(screen.getByText('확인')).toBeOnTheScreen();
  });

  it('loading이면 ActivityIndicator를 표시하고 비활성화한다', async () => {
    const onPress = jest.fn();

    await render(
      <Button variant="primary" size="lg" loading onPress={onPress}>
        확인
      </Button>,
    );

    expect(screen.getByText('확인')).toBeOnTheScreen();
    expect(screen.getByTestId('button')).toBeDisabled();
    expect(screen.getByTestId('button')).toHaveStyle({ opacity: 0.4 });

    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('disabled이면 비활성화하고 onPress를 호출하지 않는다', async () => {
    const onPress = jest.fn();

    await render(
      <Button variant="primary" size="lg" disabled onPress={onPress}>
        확인
      </Button>,
    );

    expect(screen.getByTestId('button')).toBeDisabled();
    expect(screen.getByTestId('button')).toHaveStyle({ opacity: 0.4 });

    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('fullWidth이면 stretch한다', async () => {
    await render(
      <Button variant="primary" size="lg" fullWidth onPress={jest.fn()}>
        확인
      </Button>,
    );

    expect(screen.getByTestId('button')).toHaveStyle({ alignSelf: 'stretch' });
  });

  it('onPress를 호출한다', async () => {
    const onPress = jest.fn();

    await render(
      <Button variant="primary" size="lg" onPress={onPress}>
        확인
      </Button>,
    );

    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
