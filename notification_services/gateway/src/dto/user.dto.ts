export interface IUserDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  push_token: string;
  preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
  };
  is_active: true;
  created_at: string;
  updated_at: string;
}
