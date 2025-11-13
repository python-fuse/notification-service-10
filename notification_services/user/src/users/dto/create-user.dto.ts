import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Lando' })
    first_name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Norris' })
    last_name: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty({ required: false, example: 'fcm_device_token_here' })
    @IsOptional()
    @IsString()
    push_token?: string;

    @ApiProperty({
    required: false,
    example: {
      email_notifications: true,
      push_notifications: false,
      language: 'en',
      timezone: 'UTC',
    },
  })
    @IsOptional()
    @IsObject()
    preferences?: Record<string, any>;
}
