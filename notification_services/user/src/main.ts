import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';

   // Global prefix
  app.setGlobalPrefix(apiPrefix);

  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User management and authentication service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port ?? 3001);
  logger.log(`🚀 User Service is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);}
bootstrap();
