import { fireEvent, render, screen } from '@testing-library/react-native';

import colors from '../../../lib/constants/colors';

import CodeInput from './CodeInput';

describe('CodeInput', () => {
  it('기본 6자리 입력 필드를 렌더한다', async () => {
    await render(<CodeInput value="123456" onChange={jest.fn()} />);

    expect(screen.getByLabelText('인증 코드 입력')).toHaveProp('maxLength', 6);
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('4')).toBeOnTheScreen();
    expect(screen.getByText('5')).toBeOnTheScreen();
    expect(screen.getByText('6')).toBeOnTheScreen();
  });

  it('length prop에 따라 셀 개수를 조정한다', async () => {
    await render(<CodeInput value="1234" onChange={jest.fn()} length={4} />);

    expect(screen.getByLabelText('인증 코드 입력')).toHaveProp('maxLength', 4);
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('4')).toBeOnTheScreen();
    expect(screen.queryByText('5')).not.toBeOnTheScreen();
  });

  it('입력값을 각 셀에 표시한다', async () => {
    await render(<CodeInput value="123" onChange={jest.fn()} />);

    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('onChange를 호출한다', async () => {
    const onChange = jest.fn();
    await render(<CodeInput value="" onChange={onChange} />);

    await fireEvent.changeText(screen.getByLabelText('인증 코드 입력'), '123456');

    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('숫자가 아닌 문자는 제거한다', async () => {
    const onChange = jest.fn();
    await render(<CodeInput value="" onChange={onChange} />);

    await fireEvent.changeText(screen.getByLabelText('인증 코드 입력'), '12a3b4');

    expect(onChange).toHaveBeenCalledWith('1234');
  });

  it('length를 초과하는 입력은 잘라낸다', async () => {
    const onChange = jest.fn();
    await render(<CodeInput value="" onChange={onChange} length={4} />);

    await fireEvent.changeText(screen.getByLabelText('인증 코드 입력'), '123456');

    expect(onChange).toHaveBeenCalledWith('1234');
  });

  it('포커스 시 활성 셀에 강조 테두리를 적용한다', async () => {
    await render(<CodeInput value="123456" onChange={jest.fn()} />);

    const input = screen.getByLabelText('인증 코드 입력');
    await fireEvent(input, 'focus');

    expect(screen.getByText('6').parent).toHaveStyle({ borderColor: colors.forest700 });
    expect(screen.getByText('1').parent).toHaveStyle({ borderColor: colors.stone300 });
  });

  it('블러 시 활성 셀 강조를 해제한다', async () => {
    await render(<CodeInput value="123456" onChange={jest.fn()} />);

    const input = screen.getByLabelText('인증 코드 입력');
    await fireEvent(input, 'focus');
    await fireEvent(input, 'blur');

    expect(screen.getByText('6').parent).toHaveStyle({ borderColor: colors.stone300 });
  });

  it('OTP 입력에 맞는 TextInput 속성을 설정한다', async () => {
    await render(<CodeInput value="" onChange={jest.fn()} />);

    const input = screen.getByLabelText('인증 코드 입력');

    expect(input).toHaveProp('keyboardType', 'number-pad');
    expect(input).toHaveProp('textContentType', 'oneTimeCode');
    expect(input).toHaveProp('autoComplete', 'sms-otp');
    expect(input).toHaveProp('caretHidden', true);
  });
});
