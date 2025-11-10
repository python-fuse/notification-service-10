import { Injectable } from '@nestjs/common';
import { NotificationDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  initiateNotification(notification: NotificationDto) {}
}
