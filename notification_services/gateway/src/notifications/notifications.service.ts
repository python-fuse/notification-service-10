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
import {
  ExternalUserService,
  ExternalTemplateService,
} from './external/external-services';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private userService = new ExternalUserService(new ConfigService());
  private templateService = new ExternalTemplateService(new ConfigService());

  constructor(
    @InjectRepository(NotificationRequest)
    private repo: Repository<NotificationRequest>,
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async initiateNotification(dto: NotificationDto, requestId: string) {
    try {
      // Step 1: Check Redis cache (fast path)
      const cached = await this.redisService.getIdempotencyResponse(requestId);
      if (cached) return cached;

      // Step 2: Check if request_id already exists in database (cache miss/expired)
      const existingNotification = await this.repo.findOne({
        where: { request_id: requestId },
      });

      if (existingNotification) {
        // Request was already processed but cache expired
        // Reconstruct response from database
        const response: NotificationResponseDto = {
          success: true,
          message: 'Notification already processed',
          error: null,
          data: {
            status: existingNotification.status,
            request_id: requestId,
          },
          meta: {
            note: 'This request was already processed. Returning existing result.',
          },
        };

        // Re-cache the response
        await this.redisService.setIdempotencyResponse(requestId, response);

        return response;
      }

      // Step 3: New request - proceed with processing
      // grab user
      const userData = await this.userService.getUserById(dto.user_id);
      console.log('User Data:', userData);

      // grab template
      const template = await this.templateService.getTemplate(
        dto.template_code,
      );

      console.log('Template Data:', template);

      // save to db and redis
      const notification = await this.repo.save({
        request_id: requestId,
        channel: dto.channel,
        template_code: dto.template_code,
        data: dto.data,
        status: 'queued',
        user_id: dto.user_id,
      });

      await this.redisService.cacheStatus(requestId, notification);

      // crate a mq message
      const notificationQueueItem: NotificationMessage = {
        channel: dto.channel as 'email' | 'push',
        request_id: requestId,
        user_id: dto.user_id,
        template_code: template.code,
        timestamp: new Date().toISOString(),
        data: dto.data,
        correlation_id: requestId,
        attempts: 0,
        email: userData.email,
        push_token: userData.push_token,
        body: template.latest_version.body,
        language: template.language,
        body_html: template.latest_version.body_html,
        subject: template.latest_version.subject,
        placeholders: template.latest_version.placeholders,
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
        meta: {
          user_contact: {
            email: userData.email,
            push_token: userData.push_token,
          },
          template: {
            ...template.latest_version,
          },
        },
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
        status: cached.status,
        user_id: cached.user_id,
        channel: cached.channel,
      },
      meta: {
        requested_at: cached.created_at,
        last_updated: cached.updated_at,
      },
    };
  }
}
