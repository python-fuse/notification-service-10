import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';

export interface NotificationMessage {
  request_id: string;
  user_id: string;
  email?: string;
  push_token?: string;
  channel: 'email' | 'push';
  // subject?: string;
  // body: string;
  data?: Record<string, any>;
  timestamp: string;
  correlation_id?: string;
  attempts?: number;
  template_code: string;
}

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      // Don't throw - allow the app to start even if RabbitMQ is not available
      // The connection will be attempted again when sending messages
    }
  }

  // Send message to email queue
  async publishToEmailQueue(message: NotificationMessage): Promise<void> {
    try {
      const queue = this.config.get<string>('RABBITMQ_QUEUE_EMAIL');
      this.client.emit(queue, message);
      this.logger.log(
        `Published message to email queue: ${message.request_id}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish to email queue', error);
      throw error;
    }
  }

  // Send message to push notification queue
  async publishToPushQueue(message: NotificationMessage): Promise<void> {
    try {
      const queue = this.config.get<string>('RABBITMQ_QUEUE_PUSH');
      this.client.emit(queue, message);
      this.logger.log(`Published message to push queue: ${message.request_id}`);
    } catch (error) {
      this.logger.error('Failed to publish to push queue', error);
      throw error;
    }
  }

  // Health check
  isConnected(): boolean {
    try {
      // Check if client exists and is connected
      return !!this.client;
    } catch (error) {
      return false;
    }
  }

  // // listen to status updates
  // listenToStatusQueue(callback:(data:any)=>void) {
  //   const queue = this.config.get<string>('RABBITMQ_QUEUE_STATUS');
  //   return this.client.
  // }
}
