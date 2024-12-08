import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const configService = new ConfigService();
const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  logger.log(`Application runnning at ${configService.get('NODE_ENV')}`);
  if ( configService.get('NODE_ENV') !== 'production' ) {
    const config = new DocumentBuilder()
      .setTitle('ARANDU')
      .setDescription('Endpoints do UserService ARANDU')
      .setVersion('1.0')
      .addTag('UserService')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(configService.get('PORT'), '0.0.0.0', () => {
    logger.log(`Application listening on port ${configService.get('PORT')}`);
  });
  
}
bootstrap();
