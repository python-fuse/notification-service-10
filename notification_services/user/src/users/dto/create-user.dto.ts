import { IsEmail, IsString, MinLength, IsOptional, IsObject } from 'class-validator';
export class CreateUserDto {
    @IsString()
    first_name: string;

    @IsString()
    last_name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsString()
    push_token?: string;

    @IsOptional()
    @IsObject()
    preferences?: Record<string, any>;
}
