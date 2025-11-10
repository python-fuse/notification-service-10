import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [],
  providers: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
