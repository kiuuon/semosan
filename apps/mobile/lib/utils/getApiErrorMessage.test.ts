import axios from 'axios';

import { getApiErrorMessage } from './getApiErrorMessage';

describe('getApiErrorMessage', () => {
  it('axios 응답의 message 문자열을 반환한다', () => {
    const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
      data: { message: '이메일 형식이 올바르지 않습니다.' },
    });

    expect(getApiErrorMessage(error)).toBe('이메일 형식이 올바르지 않습니다.');
  });

  it('axios 응답의 message 배열을 쉼표로 이어 반환한다', () => {
    const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
      data: { message: ['이메일을 입력해 주세요.', '비밀번호를 입력해 주세요.'] },
    });

    expect(getApiErrorMessage(error)).toBe('이메일을 입력해 주세요., 비밀번호를 입력해 주세요.');
  });

  it('axios 응답이 없으면 네트워크 안내 메시지를 반환한다', () => {
    const error = new axios.AxiosError('Network Error', 'ERR_NETWORK');

    expect(getApiErrorMessage(error)).toBe('네트워크 연결을 확인해 주세요.');
  });

  it('일반 Error의 message를 반환한다', () => {
    expect(getApiErrorMessage(new Error('알 수 없는 오류'))).toBe('알 수 없는 오류');
  });

  it('알 수 없는 에러는 기본 fallback 메시지를 반환한다', () => {
    expect(getApiErrorMessage('unexpected')).toBe('요청에 실패했습니다.');
  });

  it('커스텀 fallback 메시지를 사용할 수 있다', () => {
    expect(getApiErrorMessage(null, '로그인에 실패했습니다.')).toBe('로그인에 실패했습니다.');
  });
});
