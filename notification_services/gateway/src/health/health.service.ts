import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRequest } from 'src/entities/notification-request.entity';
import { RedisService } from 'src/redis/redis.service';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

export interface ServiceHealth {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    rabbitmq: ServiceHealth;
  };
}

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(NotificationRequest)
    private repo: Repository<NotificationRequest>,
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const startTime = Date.now();

    // Run all health checks in parallel
    const [dbHealth, redisHealth, rabbitHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRabbitMQ(),
    ]);

    const allUp =
      dbHealth.status === 'up' &&
      redisHealth.status === 'up' &&
      rabbitHealth.status === 'up';

    const someDown =
      dbHealth.status === 'down' ||
      redisHealth.status === 'down' ||
      rabbitHealth.status === 'down';

    let overallStatus: 'ok' | 'degraded' | 'down';
    if (allUp) {
      overallStatus = 'ok';
    } else if (someDown) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'down';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        redis: redisHealth,
        rabbitmq: rabbitHealth,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Simple query to check DB connection
      await this.repo.query('SELECT 1');
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Try to set and get a test key
      const testKey = 'health:check';
      const testValue = Date.now().toString();

      await this.redisService.setIdempotencyResponse(testKey, testValue, 10);
      const result = await this.redisService.getIdempotencyResponse(testKey);

      if (result === testValue) {
        return {
          status: 'up',
          responseTime: Date.now() - start,
        };
      } else {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: 'Redis read/write mismatch',
        };
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }

  private async checkRabbitMQ(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Check if RabbitMQ service is connected
      const isConnected = this.rabbitMQService.isConnected();

      if (isConnected) {
        return {
          status: 'up',
          responseTime: Date.now() - start,
        };
      } else {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: 'RabbitMQ not connected',
        };
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }
}
