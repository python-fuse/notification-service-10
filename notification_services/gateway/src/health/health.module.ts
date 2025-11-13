import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { NotificationRequest } from 'src/entities/notification-request.entity';
import { RedisModule } from 'src/redis/redis.module';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRequest]),
    RedisModule,
    RabbitmqModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
