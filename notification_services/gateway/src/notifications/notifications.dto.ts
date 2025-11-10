import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// {
//   "user_id": "12345",
//   "channel": "email",
//   "template_code": "password_reset",
//   "data": {
//     "reset_link": "https://app.com/reset?token=xyz"
//   }
// }

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['email', 'push'])
  channel: string;

  @IsString()
  @IsNotEmpty()
  template_code: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}
