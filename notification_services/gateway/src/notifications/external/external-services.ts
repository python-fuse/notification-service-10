import { IUserDto } from 'src/dto/user.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

export class ExternalUserService {
  private USER_BASE_URL: string;
  constructor(private readonly config: ConfigService) {
    this.USER_BASE_URL =
      this.config.get<string>('NODE_ENV') === 'production'
        ? 'http://user_service:3001/api/v1/users'
        : 'http://localhost:3001/api/v1/users';
  }

  async getUserById(userId: string): Promise<IUserDto> {
    try {
      const userResponse: IUserDto = (
        await axios.get(this.USER_BASE_URL + `/${userId}`)
      ).data;
      return userResponse;
    } catch (e) {
      throw new HttpException(
        {
          success: false,
          message: 'User not found',
          error: 'INVALIDE_USER_ID',
          data: null,
          meta: null,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}

export class MockTemplateService {
  async getTemplate(templateCode: string) {
    // Return mock data for testing
    return {
      success: true,
      message: 'template retrieved',
      data: {
        template_code: templateCode,
        subject: 'Test Subject',
        template_body: 'Hello {{name}}, this is a test: {{message}}',
        variables: ['name', 'message'],
        version: 1,
      },
      error: null,
      meta: null,
    };
  }
}
