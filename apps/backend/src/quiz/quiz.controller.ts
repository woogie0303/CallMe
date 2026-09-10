import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentReader } from '../common/current-reader.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AnswerQuizDto, QuizSessionQuery } from './dto/quiz.dto';
import { QuizService } from './quiz.service';

/**
 * 퀴즈 — 예전에 헷갈렸던 표현을, 그때 그 문장에서 다시 만난다.
 *
 * 문제를 서버에 저장해 두지 않는다. 낼 때마다 지금의 서랍에서 다시 고르고,
 * 답을 낼 때 항목 id와 문장 id를 함께 받는다 — 풀다 만 문제를 이어서 풀 일이
 * 없고, 이어붙일 상태가 없으면 어긋날 상태도 없다.
 */
@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  /** 빈 배열이면 아직 낼 문제가 없다는 뜻이다 (담은 게 적거나, 전부 쉬는 중) */
  @Get()
  session(@CurrentReader() readerId: string, @Query() query: QuizSessionQuery) {
    return this.quiz.session(readerId, query.size);
  }

  @Post('answers')
  @HttpCode(200)
  answer(@CurrentReader() readerId: string, @Body() dto: AnswerQuizDto) {
    return this.quiz.answer(readerId, dto);
  }
}
