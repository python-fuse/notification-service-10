import { IUserDto } from 'src/dto/user.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ITemplateDto } from 'src/dto/template.dto';

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
      ).data.data;
      console.log('Fetched User:', userResponse);
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

export class ExternalTemplateService {
  private TEMPLATE_BASE_URL: string;
  constructor(private readonly config: ConfigService) {
    this.TEMPLATE_BASE_URL =
      this.config.get<string>('NODE_ENV') === 'production'
        ? 'http://template_service:5000/api/v1/templates'
        : 'http://localhost:5000/api/v1/templates';
  }
  async getTemplate(templateCode: string) {
    try {
      const templateResponse: ITemplateDto = (
        await axios.get(this.TEMPLATE_BASE_URL + `/${templateCode}`)
      ).data.data;

      return templateResponse;
    } catch (e) {
      throw new HttpException(
        {
          success: false,
          message: 'Template not found',
          error: 'INVALIDE_TEMPLATE_CODE',
          data: null,
          meta: null,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
