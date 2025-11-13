import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// {
//   "user_id": "12345",
//   "channel": "email",
//   "template_code": "password_reset",
//   "data": {
//     "reset_link": "https://app.com/reset?token=xyz"
//   }
// }

export class NotificationDto {
  @ApiProperty({
    description: 'Unique identifier of the user ',
    example: '1daf-2dasd-dfds-dfsa',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Notification channel',
    enum: ['email', 'push'],
    example: 'email',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['email', 'push'])
  channel: string;

  @ApiProperty({
    description: 'Email template to use for the notification',
    example: 'password_reset',
  })
  @IsString()
  @IsNotEmpty()
  template_code: string;

  @ApiProperty({
    description: 'Dynamic data to populate the template',
    example: {
      name: 'Ada',
      reset_link: 'https://app.com/reset?token=krm262',
    },
  })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}

// notifications-response.dto.ts

export class NotificationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'notification queued' })
  message: string;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  error: string | null;

  @ApiProperty({
    example: {
      request_id: 'req_98123abf',
      status: 'queued',
    },
  })
  data: {
    request_id: string;
    status: string;
  };

  @ApiProperty({
    example: null,
    nullable: true,
  })
  meta: any;
}

export class NotificationStatusResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'status retrieved' })
  message: string;

  @ApiProperty({
    example: {
      request_id: 'req_98123abf',
      channel: 'email',
      status: 'delivered',
      last_updated: '2025-11-09T12:02:10Z',
    },
  })
  data: {
    request_id: string;
    channel: string;
    status: string;
    last_updated: string;
  };

  @ApiProperty({
    example: null,
    nullable: true,
  })
  error: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  meta: any;
}
