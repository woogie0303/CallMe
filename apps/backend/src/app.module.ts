import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AsksModule } from './asks/asks.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { ItemsModule } from './items/items.module';
import { ReadersModule } from './readers/readers.module';
import { ReadingModule } from './reading/reading.module';
import { RetellsModule } from './retells/retells.module';
import { SentencesModule } from './sentences/sentences.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
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
  providers: [AppService],
})
export class AppModule {}
