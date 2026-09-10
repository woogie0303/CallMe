import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Book, BookSchema } from '../books/book.schema';
import { LexicalItem, LexicalItemSchema } from '../items/lexical-item.schema';
import { Sentence, SentenceSchema } from '../sentences/sentence.schema';
import { QuizAttempt, QuizAttemptSchema } from './quiz-attempt.schema';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LexicalItem.name, schema: LexicalItemSchema },
      { name: Sentence.name, schema: SentenceSchema },
      { name: Book.name, schema: BookSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
    ]),
    AuthModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
