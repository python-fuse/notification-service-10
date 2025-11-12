import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';

export interface NotificationMessage {
  request_id: string;
  user_id: string;
  email?: string;
  push_token?: string;
  channel: 'email' | 'push';
  subject?: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
  correlation_id?: string;
  attempts?: number;
  template_code: string;
  language?: string;
  body_html?: string;
  placeholders?: string[];
}

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  constructor(
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      // Create direct connection for publishing to specific queues
      const rabbitUrl = this.config.get<string>('RABBITMQ_URL');
      this.connection = amqp.connect([rabbitUrl]);

      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: any) => {
          // Ensure queues exist
          await channel.assertQueue(
            this.config.get<string>('RABBITMQ_QUEUE_EMAIL'),
            { durable: true },
          );
          await channel.assertQueue(
            this.config.get<string>('RABBITMQ_QUEUE_PUSH'),
            { durable: true },
          );
        },
      });

      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  // Send message to email queue
  async publishToEmailQueue(message: NotificationMessage): Promise<void> {
    try {
      const queue =
        this.config.get<string>('RABBITMQ_QUEUE_EMAIL') || 'email.queue';
      await this.channelWrapper.sendToQueue(queue, message);
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
      const queue =
        this.config.get<string>('RABBITMQ_QUEUE_PUSH') || 'push.queue';
      await this.channelWrapper.sendToQueue(queue, message);
      this.logger.log(`Published message to push queue: ${message.request_id}`);
    } catch (error) {
      this.logger.error('Failed to publish to push queue', error);
      throw error;
    }
  }

  // Health check
  isConnected(): boolean {
    try {
      return this.connection && this.connection.isConnected();
    } catch (error) {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.channelWrapper?.close();
    await this.connection?.close();
  }
}
