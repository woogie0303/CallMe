import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Reader, ReaderSchema } from './reader.schema';
import { ReadersController } from './readers.controller';
import { ReadersService } from './readers.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Reader.name, schema: ReaderSchema }]), AuthModule],
  controllers: [ReadersController],
  providers: [ReadersService],
})
export class ReadersModule {}
