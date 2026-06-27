import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { MailService } from './mail.service';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe('MailService', () => {
  let service: MailService;
  let configService: jest.Mocked<ConfigService>;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockSend.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    configService = module.get(ConfigService);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('when RESEND_API_KEY is not configured', () => {
    beforeEach(async () => {
      configService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [MailService, { provide: ConfigService, useValue: configService }],
      }).compile();

      service = module.get(MailService);
    });

    it('logs verification code in development mode without sending email', async () => {
      await service.sendVerificationCode('test@example.com', '123456');

      expect(warnSpy).toHaveBeenCalledWith('[DEV] Email verification code for test@example.com: 123456');
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('when RESEND_API_KEY is configured', () => {
    beforeEach(async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'RESEND_API_KEY') return 'test-api-key';
        if (key === 'RESEND_FROM_EMAIL') return 'noreply@example.com';
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [MailService, { provide: ConfigService, useValue: configService }],
      }).compile();

      service = module.get(MailService);
    });

    it('sends verification email through Resend', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

      await service.sendVerificationCode('test@example.com', '123456');

      expect(mockSend).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'test@example.com',
        subject: '이메일 인증 코드',
        html: expect.stringContaining('123456'),
      });
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('uses default from address when RESEND_FROM_EMAIL is missing', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'RESEND_API_KEY') return 'test-api-key';
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [MailService, { provide: ConfigService, useValue: configService }],
      }).compile();
      service = module.get(MailService);

      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

      await service.sendVerificationCode('test@example.com', '123456');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'onboarding@resend.dev',
        }),
      );
    });

    it('logs error when Resend returns an error', async () => {
      const resendError = { message: 'send failed' };
      mockSend.mockResolvedValue({ data: null, error: resendError });

      await service.sendVerificationCode('test@example.com', '123456');

      expect(errorSpy).toHaveBeenCalledWith('Failed to send verification email to test@example.com', resendError);
    });
  });
});
