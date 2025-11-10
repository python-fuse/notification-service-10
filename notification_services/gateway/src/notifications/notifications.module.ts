import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRequest } from 'src/entities/notification-request.entity';
import { RedisModule } from 'src/redis/redis.module';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { IdempotencyMiddleware } from 'src/middleware/idempotency.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRequest]),
    RedisModule,
    RabbitmqModule,
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdempotencyMiddleware).forRoutes({
      path: 'api/v1/notifications/send',
      method: RequestMethod.POST,
    });
  }
}
