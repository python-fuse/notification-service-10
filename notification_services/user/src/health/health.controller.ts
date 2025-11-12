import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from 'src/database/database.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    let dbHealthy = false;

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (error) {
      dbHealthy = false;
    }

    return {
      status: dbHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      version: '1.0.0',
      checks: {
        db: dbHealthy ? 'ok' : 'error',
      },
    };
  }
}