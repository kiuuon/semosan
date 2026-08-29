import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import colors from '../../../lib/constants/colors';

import Input from './Input';

describe('Input', () => {
  it('label과 placeholder를 렌더한다', async () => {
    await render(<Input label="이메일" placeholder="example@email.com" value="" onChangeText={jest.fn()} />);

    expect(screen.getByText('이메일')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('example@email.com')).toBeOnTheScreen();
  });

  it('onChangeText를 호출한다', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="이메일" placeholder="example@email.com" value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'test@example.com');

    expect(onChangeText).toHaveBeenCalledWith('test@example.com');
  });

  it.each([
    ['default', colors.stone300],
    ['active', colors.forest700],
    ['error', colors.danger],
  ] as const)('%s status 보더 색상을 적용한다', async (status, borderColor) => {
    await render(
      <Input label="이메일" placeholder="example@email.com" value="" onChangeText={jest.fn()} status={status} />,
    );

    expect(screen.getByPlaceholderText('example@email.com').parent).toHaveStyle({ borderColor });
  });

  it.each([
    ['small', 36],
    ['medium', 44],
    ['large', 52],
  ] as const)('%s size 높이를 적용한다', async (size, height) => {
    await render(
      <Input label="이메일" placeholder="example@email.com" value="" onChangeText={jest.fn()} size={size} />,
    );

    expect(screen.getByPlaceholderText('example@email.com').parent).toHaveStyle({ height });
  });

  it('기본 size는 large이다', async () => {
    await render(<Input label="이메일" placeholder="example@email.com" value="" onChangeText={jest.fn()} />);

    expect(screen.getByPlaceholderText('example@email.com').parent).toHaveStyle({ height: 52 });
  });

  it.each([
    ['error', colors.danger],
    ['active', colors.forest700],
    ['default', colors.stone500],
  ] as const)('%s status caption 색상을 적용한다', async (status, color) => {
    await render(
      <Input
        label="이메일"
        placeholder="example@email.com"
        value=""
        onChangeText={jest.fn()}
        status={status}
        caption="안내 문구"
      />,
    );

    expect(screen.getByText('안내 문구')).toHaveStyle({ color });
  });

  it('accessoryLeft와 accessoryRight를 렌더한다', async () => {
    await render(
      <Input
        label="이메일"
        placeholder="example@email.com"
        value=""
        onChangeText={jest.fn()}
        accessoryLeft={<Text>왼쪽</Text>}
        accessoryRight={<Text>오른쪽</Text>}
      />,
    );

    expect(screen.getByText('왼쪽')).toBeOnTheScreen();
    expect(screen.getByText('오른쪽')).toBeOnTheScreen();
  });

  it('secureTextEntry이면 비밀번호를 숨기고 토글할 수 있다', async () => {
    await render(
      <Input label="비밀번호" placeholder="비밀번호를 입력하세요" value="" onChangeText={jest.fn()} secureTextEntry />,
    );

    const textInput = screen.getByPlaceholderText('비밀번호를 입력하세요');
    expect(textInput.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByLabelText('비밀번호 표시'));

    expect(screen.getByPlaceholderText('비밀번호를 입력하세요').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('비밀번호 숨기기')).toBeOnTheScreen();
  });

  it('엔터를 누르면 onSubmitEditing을 호출한다', async () => {
    const onSubmitEditing = jest.fn();
    await render(
      <Input
        placeholder="산 이름으로 검색"
        value="북한산"
        onChangeText={jest.fn()}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />,
    );

    await fireEvent(screen.getByPlaceholderText('산 이름으로 검색'), 'submitEditing');

    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
  });
});
