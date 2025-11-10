import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRequest } from 'src/entities/notification-request.entity';
import { RedisModule } from 'src/redis/redis.module';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRequest]),
    RedisModule,
    RabbitmqModule,
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
