import { IsEmail, IsString, MinLength, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsOptional()
    @IsString()
    push_token?: string;

    @IsOptional()
    @IsObject()
    preferences?: Record<string, any>;
}
