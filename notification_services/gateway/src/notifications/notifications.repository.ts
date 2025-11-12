import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRequest } from 'src/entities/notification-request.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(NotificationRequest)
    private readonly notificationRequestRepo: Repository<NotificationRequest>,
  ) {}

  async createNotificationRequest(
    data: Partial<NotificationRequest>,
  ): Promise<NotificationRequest> {
    const notification = this.notificationRequestRepo.create(data);
    return this.notificationRequestRepo.save(notification);
  }

  async findNotificationByRequestId(
    requestId: string,
  ): Promise<NotificationRequest | null> {
    return await this.notificationRequestRepo.findOne({
      where: { request_id: requestId },
    });
  }

  async updateNotificationStatus(
    requestId: string,
    status: string,
    errorMessage: string,
  ): Promise<void> {
    await this.notificationRequestRepo.update(
      { request_id: requestId },
      { status: status, error_message: errorMessage },
    );
  }

  async findByUserId(userId: string): Promise<NotificationRequest[]> {
    return await this.notificationRequestRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<NotificationRequest[]> {
    return await this.notificationRequestRepo.find({
      where: { status: status },
      order: { created_at: 'ASC' },
    });
  }
}
