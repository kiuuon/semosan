import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { MailModule } from '../mail/mail.module';
import { EmailVerification, EmailVerificationSchema } from '../schemas/email-verification.schema';
import { RefreshToken, RefreshTokenSchema } from '../schemas/refresh-token.schema';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailVerificationService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, EmailVerificationService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
