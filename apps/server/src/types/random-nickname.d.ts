declare module '@woowa-babble/random-nickname' {
  export type NicknameType = 'animals' | 'characters' | 'heros' | 'monsters';

  export function getRandomNickname(type: NicknameType): string | undefined;
}
