import { Body, Controller, Post } from '@nestjs/common';
import { NotificationDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {} //     {
  //   "user_id": "12345",
  //   "channel": "email",
  //   "template_code": "password_reset",
  //   "data": {
  //     "reset_link": "https://app.com/reset?token=xyz"
  //   }
  // }

  @Post()
  initiateNotification(@Body() body: NotificationDto) {
    const notification = new NotificationDto(body);

    const response =
      this.notificationsService.initiateNotification(notification);
  }
}
