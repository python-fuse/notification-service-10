import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsModule } from './notifications/notifications.module';

// env configuration
import { ConfigModule, ConfigService } from '@nestjs/config';

// database
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRequest } from './entities/notification-request.entity';

// redis
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RedisModule } from './redis/redis.module';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('GATEWAY_DATABASE_URL'),
        entities: [NotificationRequest],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        url: config.get<string>('REDIS_URL'),
        ttl: config.get<number>('REDIS_TTL'),
      }),
    }),

    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get('RABBITMQ_URL')],
            queue: 'notifications_main',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),

    NotificationsModule,

    RedisModule,

    RabbitmqModule,
  ],
  controllers: [AppController],
  providers: [AppService, NotificationsService, RabbitmqService],
})
export class AppModule {}
