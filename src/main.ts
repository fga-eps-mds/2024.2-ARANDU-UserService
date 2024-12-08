import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const configService = new ConfigService();
const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(configService.get('PORT'), '0.0.0.0', () => {
    logger.log(`Application listening on port ${configService.get('PORT')}`);
  });
  
}
bootstrap();
