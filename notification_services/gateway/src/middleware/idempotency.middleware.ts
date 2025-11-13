import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from 'src/redis/redis.service';
import uuid from 'uuid';

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
      // Check the current status
      const statusData = await this.redisService.getCachedStatus(requestId);

      if (statusData && statusData.status === 'queued') {
        // Still queued - let it pass through to service for re-queueing
        this.logger.log(
          `Request ${requestId} is still queued. Allowing re-queue attempt.`,
        );
        return next();
      }

      // For other statuses (processing, delivered, failed), return cached response with updated message
      let message = 'Notification already processed';
      let note =
        'This request was already processed. Returning existing result.';

      if (statusData) {
        switch (statusData.status) {
          case 'processing':
            message = 'Notification is currently being processed';
            note =
              'This request is currently being processed. Please wait for completion.';
            break;
          case 'delivered':
            message = 'Notification delivered successfully';
            note = 'This notification was already delivered successfully.';
            break;
          case 'failed':
            message = 'Notification delivery failed';
            note =
              'This notification failed to deliver. Check the error details for more information.';
            break;
        }
      }

      // Update cached response with current status and appropriate message
      const updatedResponse = {
        ...cachedResponse,
        message,
        data: {
          ...cachedResponse.data,
          status: statusData?.status || cachedResponse.data.status,
        },
        meta: {
          ...cachedResponse.meta,
          note,
        },
      };

      return res.status(200).json(updatedResponse);
    }

    next();
  }
}
