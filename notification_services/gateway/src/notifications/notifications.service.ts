import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { NotificationDto, NotificationResponseDto } from './notifications.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuid } from 'uuid';
import { NotificationRequest } from 'src/entities/notification-request.entity';
import { RedisService } from 'src/redis/redis.service';
import {
  NotificationMessage,
  RabbitMQService,
} from 'src/rabbitmq/rabbitmq.service';
import { MockUserService, MockTemplateService } from './mocks/mock-services';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationsService {
  private mockUserService = new MockUserService();
  private mockTemplateService = new MockTemplateService();

  constructor(
    @InjectRepository(NotificationRequest)
    private repo: Repository<NotificationRequest>,
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async initiateNotification(dto: NotificationDto, requestId: string) {
    try {
      // CHeck idempotency
      const cached = await this.redisService.getIdempotencyResponse(requestId);

      if (cached) return cached;

      // grab user
      const userData = await this.mockUserService.getUserById(dto.user_id);
      if (!userData.success) {
        throw new HttpException(
          {
            success: false,
            message: 'User not found',
            error: 'INVALIDE_USER_ID',
            data: null,
            meta: null,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // grab template
      const template = await this.mockTemplateService.getTemplate(
        dto.template_code,
      );
      if (!template.success) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
            error: 'INVALIDE_TEMPLATE_CODE',
            data: null,
            meta: null,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // save to db and redis
      const notification = await this.repo.save({
        request_id: requestId,
        channel: dto.channel,
        template_code: dto.template_code,
        data: dto.data,
        status: 'queued',
        user_id: dto.user_id,
      });

      await this.redisService.cacheStatus(requestId, 'queued');

      // crate a mq message
      const notificationQueueItem: NotificationMessage = {
        channel: dto.channel as 'email' | 'push',
        request_id: requestId,
        user_id: dto.user_id,
        template_code: dto.template_code,
        timestamp: new Date().toISOString(),
        data: dto.data,
        correlationId: requestId,
        attempts: 0,
        email: userData.data.email,
        push_token: userData.data.push_token,
      };

      // add to proper queue
      if (dto.channel == 'email') {
        await this.rabbitMQService.publishToEmailQueue(notificationQueueItem);
      } else {
        await this.rabbitMQService.publishToPushQueue(notificationQueueItem);
      }

      // respond
      const response: NotificationResponseDto = {
        success: true,
        message: 'Notification queued',
        error: null,
        data: {
          status: 'queued',
          request_id: requestId,
        },
        meta: {},
      };

      // store idempotency in redis
      await this.redisService.setIdempotencyResponse(requestId, response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getStatus(requestId: string) {
    const cached = await this.redisService.getCachedStatus(requestId);

    if (!cached) {
      throw new HttpException(
        {
          data: null,
          error: 'NOT_FOUND',
          message: 'Status not found for this request id',
          meta: null,
          success: false,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      message: 'Status retrieved successfully',
      error: null,
      data: {
        request_id: requestId,
        status: cached,
      },
      meta: {},
    };
  }
}
