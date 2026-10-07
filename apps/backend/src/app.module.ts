import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AsksModule } from './asks/asks.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { RateLimitGuard, rateLimitOptions } from './common/rate-limit';
import { ItemsModule } from './items/items.module';
import { ReadersModule } from './readers/readers.module';
import { ReadingModule } from './reading/reading.module';
import { RetellsModule } from './retells/retells.module';
import { SentencesModule } from './sentences/sentences.module';

@Module({
  imports: [
    /** 오류 수집 — DSN이 없으면 아무것도 보내지 않는다(`instrument.ts`) */
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot(rateLimitOptions()),
    AuthModule,
    ReadersModule,
    AsksModule,
    BooksModule,
    SentencesModule,
    ItemsModule,
    ReadingModule,
    RetellsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    /** 처리하지 못한 예외를 Sentry에 남긴다. 응답은 Nest의 기본 처리 그대로다. */
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    /** 모든 길에 호출 횟수 제한을 건다 — 길마다 다른 숫자는 `@Throttle()`로 덮어쓴다 */
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
