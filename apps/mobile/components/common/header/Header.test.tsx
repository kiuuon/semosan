import { fireEvent, render, screen } from '@testing-library/react-native';

import Header from './Header';

describe('Header', () => {
  it('제목을 표시한다', async () => {
    await render(<Header title="로그인" onBack={jest.fn()} />);

    expect(screen.getByText('로그인')).toBeOnTheScreen();
  });

  it('뒤로가기 버튼을 누르면 onBack을 호출한다', async () => {
    const onBack = jest.fn();
    await render(<Header title="회원가입" onBack={onBack} />);

    await fireEvent.press(screen.getByLabelText('뒤로가기'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
