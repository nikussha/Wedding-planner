import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: [config.get<string>('CLIENT_APP_URL'), config.get<string>('CLIENT_ADMIN_URL')],
    credentials: true,
  });

  const port = config.get<string>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api`);
}

bootstrap();
