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
  requestId: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  channel: string;

  @Column()
  template_code: string;

  @Column({ default: 'queued' })
  @Index()
  status: string; // 'queued', 'processing', 'delivered', 'failed'

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
