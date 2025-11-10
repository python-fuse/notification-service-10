import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}
  private readonly logger = new Logger(IdempotencyMiddleware.name);

  async use(req: Request, res: Response, next: NextFunction) {
    this.logger.log('Checking for idempotency key in request headers');

    const requestId = req.headers['x-request-id'] as string;

    if (!requestId) {
      this.logger.warn('No idempotency key found in request headers');
      return next();
    }

    this.logger.log(`Idempotency key found: ${requestId}`);

    // check if the request ID already exists in Redis
    const cachedResponse =
      await this.redisService.getIdempotencyResponse(requestId);

    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }

    next();
  }
}
