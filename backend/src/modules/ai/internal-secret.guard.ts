import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guards the internal AI tool endpoint. Only the Python ai-service (which holds
 * the matching shared secret) may reach the CRM CRUD tools. The secret is sent
 * in the `x-internal-secret` header.
 */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  private readonly logger = new Logger(InternalSecretGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected = this.config.get<string>('ai.internalSecret');
    if (!expected) {
      this.logger.warn('AI internal secret is not configured; rejecting internal tool call.');
      return false;
    }
    const provided = request.headers['x-internal-secret'];
    return typeof provided === 'string' && provided === expected;
  }
}
