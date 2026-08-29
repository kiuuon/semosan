import getInstance from './instance';

interface SubmitSupportInquiryPayload {
  content: string;
  nickname?: string;
  email?: string;
}

export async function submitSupportInquiry(payload: SubmitSupportInquiryPayload): Promise<void> {
  const instance = await getInstance();
  await instance.post('/support/inquiries', {
    content: payload.content.trim(),
    ...(payload.nickname?.trim() ? { nickname: payload.nickname.trim() } : {}),
    ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
  });
}
