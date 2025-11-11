import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '../database/database.service';
import { User } from './entities/user.entity';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: DatabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
    createUserDto.password = hashedPassword;
    const user = await this.prisma.user.create({
      data: {
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        email: createUserDto.email,
        password: hashedPassword,
        push_token: createUserDto.push_token,
        preferences: createUserDto.preferences || {},
      },
    });

    this.logger.log(`Created user: ${user.id}`);
    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();

    this.logger.log(`Retrieved ${users.length} users`);
    return users;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`Retrieved user: ${id}`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });

      this.logger.log(`Updated user: ${id}`);
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`Deleted user: ${id}`);
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}
