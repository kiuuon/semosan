import { render, screen } from '@testing-library/react-native';

import colors from '../../../lib/constants/colors';

import ProgressBar from './ProgressBar';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe('ProgressBar', () => {
  it('현재 단계 이름을 표시한다', async () => {
    await render(<ProgressBar totalSteps={3} currentStep={1} currentStepName="이메일 인증" />);

    expect(screen.getByText('이메일 인증')).toBeOnTheScreen();
  });

  it('총 스텝 수만큼 단계 번호를 표시한다', async () => {
    await render(<ProgressBar totalSteps={3} currentStep={1} currentStepName="이메일 인증" />);

    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('현재 단계 번호는 활성 스타일을 적용한다', async () => {
    await render(<ProgressBar totalSteps={3} currentStep={2} currentStepName="비밀번호 설정" />);

    expect(screen.getByText('2')).toHaveStyle({ color: colors.white });
  });

  it('아직 도달하지 않은 단계 번호는 비활성 스타일을 적용한다', async () => {
    await render(<ProgressBar totalSteps={3} currentStep={2} currentStepName="비밀번호 설정" />);

    expect(screen.getByText('3')).toHaveStyle({ color: colors.stone300 });
  });

  it('완료된 단계는 번호 대신 체크 아이콘을 표시한다', async () => {
    await render(<ProgressBar totalSteps={3} currentStep={3} currentStepName="가입 완료" />);

    expect(screen.queryByText('1')).not.toBeOnTheScreen();
    expect(screen.queryByText('2')).not.toBeOnTheScreen();
    expect(screen.getAllByText('checkmark-circle-outline')).toHaveLength(2);
    expect(screen.getByText('3')).toBeOnTheScreen();
  });
});
