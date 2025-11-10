import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_requests')
export class NotificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  request_id: string;

  @Column()
  @Index()
  user_id: string;

  @Column()
  channel: string;

  @Column()
  template_code: string;

  @Column({ default: 'queued' })
  @Index()
  status: string; // 'queued', 'processing', 'delivered', 'failed'

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
