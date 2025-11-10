// {
//   "user_id": "12345",
//   "channel": "email",
//   "template_code": "password_reset",
//   "data": {
//     "reset_link": "https://app.com/reset?token=xyz"
//   }
// }

export class NotificationDto {
  user_id: string;
  channel: string;
  template_code: string;
  data: Record<string, any>;

  constructor(partial: Partial<NotificationDto>) {
    Object.assign(this, partial);
  }
}
