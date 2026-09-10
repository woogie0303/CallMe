import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // DTO에 선언한 것만 통과시킨다 — 클라이언트가 보낸 여분 필드는 버린다.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  /** 열려 있으면 부팅할 때마다 말한다 — 조용히 켜진 채로 배포되는 일이 없게 */
  if (process.env.ALLOW_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  개발용 로그인(POST /api/dev/login)이 열려 있습니다.');
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`CallMe API — http://localhost:${port}/api`);
}

void bootstrap();
