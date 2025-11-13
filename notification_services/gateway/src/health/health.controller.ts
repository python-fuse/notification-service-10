import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthCheckResponse } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check service health',
    description:
      'Returns health status of all dependencies (DB, Redis, RabbitMQ)',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-11-12T10:30:00.000Z',
        uptime: 3600,
        services: {
          database: {
            status: 'up',
            responseTime: 5,
          },
          redis: {
            status: 'up',
            responseTime: 2,
          },
          rabbitmq: {
            status: 'up',
            responseTime: 3,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unhealthy',
  })
  async check(): Promise<HealthCheckResponse> {
    return await this.healthService.checkHealth();
  }
}
