import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { statusCode, message } = this.resolveException(exception);
    console.log(statusCode, message);
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response.status(statusCode).json({
      statusCode,
      message,
    });
  }

  private resolveException(exception: unknown): { statusCode: number; message: string } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return { statusCode, message: exceptionResponse };
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as { message?: string | string[] };
        return {
          statusCode,
          message: this.normalizeMessage(body.message ?? exception.message),
        };
      }

      return { statusCode, message: exception.message };
    }

    if (this.isMongoDuplicateKeyError(exception)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: '중복된 값이 존재합니다. 변경 후 다시 시도해 주세요.',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  private normalizeMessage(message: string | string[]): string {
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return message;
  }

  private isMongoDuplicateKeyError(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000;
  }
}
