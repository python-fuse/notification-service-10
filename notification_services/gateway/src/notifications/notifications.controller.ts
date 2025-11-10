import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NotificationDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {} //     {

  @Post()
  @HttpCode(HttpStatus.OK)
  initiateNotification(@Body() notificationDto: NotificationDto) {
    const response =
      this.notificationsService.initiateNotification(notificationDto);
  }
}
