import { render, screen } from '@testing-library/react-native';

import colors from '../../../lib/constants/colors';

import PasswordRequirements from './PasswordRequirements';

describe('PasswordRequirements', () => {
  it('비밀번호 요건 안내를 렌더한다', async () => {
    await render(<PasswordRequirements hasMinLength={false} hasLetter={false} hasNumber={false} />);

    expect(screen.getByText('8자 이상')).toBeOnTheScreen();
    expect(screen.getByText('영문 포함')).toBeOnTheScreen();
    expect(screen.getByText('숫자 포함')).toBeOnTheScreen();
  });

  it('충족하지 않은 요건은 비활성 스타일을 적용한다', async () => {
    await render(<PasswordRequirements hasMinLength={false} hasLetter={false} hasNumber={false} />);

    expect(screen.getByText('8자 이상')).toHaveStyle({
      color: colors.stone300,
      fontFamily: 'NotoSansKR_400Regular',
    });
    expect(screen.getByText('영문 포함')).toHaveStyle({
      color: colors.stone300,
      fontFamily: 'NotoSansKR_400Regular',
    });
    expect(screen.getByText('숫자 포함')).toHaveStyle({
      color: colors.stone300,
      fontFamily: 'NotoSansKR_400Regular',
    });
  });

  it('충족한 요건은 활성 스타일을 적용한다', async () => {
    await render(<PasswordRequirements hasMinLength={true} hasLetter={true} hasNumber={true} />);

    expect(screen.getByText('8자 이상')).toHaveStyle({
      color: colors.forest900,
      fontFamily: 'NotoSansKR_500Medium',
    });
    expect(screen.getByText('영문 포함')).toHaveStyle({
      color: colors.forest900,
      fontFamily: 'NotoSansKR_500Medium',
    });
    expect(screen.getByText('숫자 포함')).toHaveStyle({
      color: colors.forest900,
      fontFamily: 'NotoSansKR_500Medium',
    });
  });

  it.each([
    ['hasMinLength', '8자 이상', { hasMinLength: true, hasLetter: false, hasNumber: false }],
    ['hasLetter', '영문 포함', { hasMinLength: false, hasLetter: true, hasNumber: false }],
    ['hasNumber', '숫자 포함', { hasMinLength: false, hasLetter: false, hasNumber: true }],
  ] as const)('%s만 충족하면 해당 요건만 활성 스타일을 적용한다', async (_prop, label, props) => {
    await render(<PasswordRequirements {...props} />);

    expect(screen.getByText(label)).toHaveStyle({
      color: colors.forest900,
      fontFamily: 'NotoSansKR_500Medium',
    });

    const inactiveLabels = ['8자 이상', '영문 포함', '숫자 포함'].filter((text) => text !== label);
    inactiveLabels.forEach((text) => {
      expect(screen.getByText(text)).toHaveStyle({
        color: colors.stone300,
        fontFamily: 'NotoSansKR_400Regular',
      });
    });
  });
});
