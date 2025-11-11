import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Query,
  UseGuards,
  Headers,
  HttpException,
} from '@nestjs/common';
import {
  NotificationDto,
  NotificationResponseDto,
  NotificationStatusResponseDto,
} from './notifications.dto';
import { NotificationsService } from './notifications.service';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RateLimitGuard } from 'src/guards/rate-limit.guard';

@ApiTags('notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {} //     {

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send notification',
    description: 'Queues a notofication to be send via email or push',
  })
  @ApiBody({ type: NotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Notification successfullt queued',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 404, description: 'User or template not found' })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  @UseGuards(RateLimitGuard)
  async initiateNotification(
    @Body() notificationDto: NotificationDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    if (!requestId) {
      throw new HttpException(
        {
          success: false,
          message: 'x-request-id header is required for idempotency',
          error: 'MISSING_REQUEST_ID',
          data: null,
          meta: {
            reason:
              'No x-request-id provided. Request cannot be safely retried.',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.notificationsService.initiateNotification(
      notificationDto,
      requestId,
    );
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get notification status',
    description: 'Retrieve the delivery status of a notification',
  })
  @ApiQuery({
    name: 'request_id',
    required: true,
    description: 'Request ID returned when notification was queued',
    example: 'req_98123abf',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    type: NotificationStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Request ID not found',
  })
  async getStatus(@Query('request_id') requestId: string) {
    return await this.notificationsService.getStatus(requestId);
  }
}
