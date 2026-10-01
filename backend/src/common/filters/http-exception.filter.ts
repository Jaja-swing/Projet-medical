import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/** Normalise toutes les erreurs de l'API dans un format de reponse unique. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorResponseBody = {
      statusCode,
      ...this.extractMessage(exception, statusCode),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url}`, (exception as Error)?.stack);
    }

    response.status(statusCode).json(body);
  }

  private extractMessage(
    exception: unknown,
    statusCode: number,
  ): Pick<ErrorResponseBody, 'message' | 'error'> {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { message: payload, error: exception.name };
      }

      const { message, error } = payload as { message?: string | string[]; error?: string };
      return {
        message: message ?? exception.message,
        error: error ?? exception.name,
      };
    }

    return { message: 'Internal server error', error: HttpStatus[statusCode] ?? 'Error' };
  }
}
