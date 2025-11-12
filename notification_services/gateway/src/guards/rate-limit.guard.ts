import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly MAX_REQUESTS = 100; // Max requests per time window
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.body.user_id) {
      return true;
    }
    const userId = request.body.user_id;

    const currentHour = new Date().toISOString().slice(0, 13);
    const requestCount = await this.redisService.incrementRateLimit(
      userId,
      currentHour,
    );

    if (requestCount > this.MAX_REQUESTS) {
      throw new HttpException(
        {
          success: false,
          message: 'Rate limit exceeded. Try again later.',
          error: 'TOO_MANY_REQUESTS',
          data: null,
          meta: {
            rateLimit: {
              maxRequests: this.MAX_REQUESTS,
              timeWindow: '1 hour',
            },
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
