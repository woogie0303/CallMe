import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Book, BookSchema } from '../books/book.schema';
import { Retell, RetellSchema } from './retell.schema';
import { RetellsController } from './retells.controller';
import { RetellsService } from './retells.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Retell.name, schema: RetellSchema },
      { name: Book.name, schema: BookSchema },
    ]),
    AuthModule,
  ],
  controllers: [RetellsController],
  providers: [RetellsService],
})
export class RetellsModule {}
