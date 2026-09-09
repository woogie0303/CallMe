import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { REGISTERS } from '../../items/lexical-item.schema';

/**
 * 모델이 돌려줘야 하는 모양. 구조화 출력(structured outputs)으로 강제하므로
 * 답을 파싱하다 실패할 일이 없다 — 대신 스키마가 곧 명세라, 여기 적힌 설명이
 * 프롬프트만큼 중요하다.
 */
const AnswerFormat = z.object({
  translation: z
    .string()
    .describe('문장 전체의 자연스러운 한국어 번역. 직역체로 쓰지 않는다.'),
  candidates: z
    .array(
      z.object({
        term: z
          .string()
          .describe(
            '표제형(canonical form). 문장에 있던 활용형이 아니라 사전에 실릴 꼴로 적는다. ' +
              '예: 문장이 "brushed it off"였다면 "brush it off".',
          ),
        meaning: z
          .string()
          .describe('이 문장에서의 뜻 하나. 사전 뜻을 나열하지 않는다.'),
        register: z.enum(REGISTERS).describe('구어체 / 중립 / 문어체'),
      }),
    )
    .describe(
      '이 문장에서 외워둘 만한 표현들. 없으면 빈 배열 — 억지로 채우지 않는다. 많아도 넷까지.',
    ),
});

export type Answer = z.infer<typeof AnswerFormat>;

/**
 * 프롬프트의 붙박이 부분. 요청마다 달라지는 것(레벨·책·문장)은 여기 넣지 않는다 —
 * 캐시는 앞에서부터 한 글자만 달라도 깨지기 때문이다(ADR-0001의 '안정적인 접두부').
 *
 * 다만 캐시에는 최소 길이가 있고 모델마다 다르다(Sonnet 5는 1024토큰, Opus 5는 512).
 * 이 프롬프트가 그보다 짧으면 cache_control을 걸어도 **조용히** 캐시되지 않는다 —
 * 오류가 나지 않으므로 usage.cache_read_input_tokens로만 확인할 수 있다.
 */
const SYSTEM = `당신은 영어 원서를 읽는 한국어 사용자를 돕습니다.

한 번에 문장 하나를 받습니다. 하는 일은 둘입니다.

1) 그 문장을 자연스러운 한국어로 옮깁니다. 학교 번역투가 아니라, 한국어로 읽었을 때
   그 장면이 그려지는 문장으로 씁니다.

2) 그 문장에서 **외워둘 만한 표현**을 골라 줍니다. 낱말 하나일 수도 있고,
   구동사나 연어처럼 여러 낱말이 붙어 하나의 뜻을 갖는 덩어리일 수도 있습니다.
   덩어리를 낱말로 쪼개지 않습니다 — "for the time being"을 for / time / being으로
   나누면 뜻이 사라집니다.

지킬 것:

- 뜻은 **그 문장에서의 뜻 하나**만 씁니다. 같은 표현도 문장이 다르면 뜻이 다릅니다.
  make out은 어떤 문장에서는 '겨우 알아보다'이고 다른 문장에서는 그렇지 않습니다.
  사전 뜻을 여러 개 나열하지 않습니다.
- 표제형으로 적습니다. 문장에 있던 활용형 그대로가 아니라 사전에 실릴 꼴로 적습니다.
- 독자의 레벨에 맞춰 설명의 깊이를 정합니다. 입문에게는 쉬운 말로 풀고,
  고급에게는 뉘앙스 차이를 짚습니다.
- **골라줄 것이 없으면 빈 배열을 돌려줍니다.** 쉬운 문장에서 억지로 표현을 만들어
  내면, 독자의 서랍이 외울 필요 없는 것들로 채워집니다. 빈 배열도 정상적인 답입니다.
- 아무리 많아도 넷까지만 고릅니다.`;

/** 답을 받지 못했다는 사실 자체. 이유는 로그로 남기고, 부른 쪽은 대기로 돌린다. */
export class AnswerUnavailable extends Error {}

/**
 * 문장 하나를 묻는 한 번의 호출.
 *
 * 파서도 사전도 두지 않는다. 문장을 설명하는 모델이 이미 문장을 외울 만한
 * 덩어리로 나누기 때문에, 같은 일을 하는 두 번째 조각을 두면 서로 다른 답을
 * 낼 뿐이다(ADR-0002).
 */
@Injectable()
export class AnswerService {
  private readonly log = new Logger(AnswerService.name);
  private readonly client?: Anthropic;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    this.model = config.get<string>('ASK_MODEL') ?? 'claude-sonnet-5';
    /** 키가 없으면 조용히 꺼둔다 — 담는 일은 그래도 성공해야 한다 */
    this.client = apiKey ? new Anthropic({ apiKey }) : undefined;
    if (!this.client) {
      this.log.warn('ANTHROPIC_API_KEY가 없어 질문은 전부 대기로 남습니다.');
    }
  }

  get ready(): boolean {
    return Boolean(this.client);
  }

  get modelName(): string {
    return this.model;
  }

  async answer(input: {
    sentence: string;
    level: string;
    bookTitle: string;
    author: string;
    page?: number;
  }): Promise<Answer> {
    if (!this.client) throw new AnswerUnavailable('AI가 설정되지 않았습니다.');

    try {
      const response = await this.client.messages.parse({
        model: this.model,
        max_tokens: 16000,
        /** 붙박이 부분만 캐시에 올린다 */
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt(input) }],
        output_config: { format: zodOutputFormat(AnswerFormat) },
      });

      /** 캐시가 실제로 걸렸는지는 이 값으로만 알 수 있다 */
      this.log.debug(
        `ask: in=${response.usage.input_tokens} cached=${response.usage.cache_read_input_tokens ?? 0} out=${response.usage.output_tokens}`,
      );

      if (response.stop_reason === 'refusal') {
        throw new AnswerUnavailable(
          `모델이 답을 거절했습니다: ${response.stop_details?.category ?? '이유 없음'}`,
        );
      }

      const parsed = response.parsed_output;
      if (!parsed) throw new AnswerUnavailable('모델의 답을 읽지 못했습니다.');

      return parsed;
    } catch (error) {
      if (error instanceof AnswerUnavailable) throw error;

      if (error instanceof Anthropic.RateLimitError) {
        this.log.warn('요청이 몰려 잠시 답할 수 없습니다.');
      } else if (error instanceof Anthropic.AuthenticationError) {
        this.log.error('ANTHROPIC_API_KEY가 올바르지 않습니다.');
      } else if (error instanceof Anthropic.APIError) {
        this.log.error(`Anthropic API ${error.status}: ${error.message}`);
      } else {
        this.log.error(`질문에 실패했습니다: ${String(error)}`);
      }

      throw new AnswerUnavailable('지금은 답을 받지 못했어요.');
    }
  }
}

/** 요청마다 달라지는 것들 — 캐시가 깨지지 않게 시스템이 아니라 여기 싣는다 */
function userPrompt(input: {
  sentence: string;
  level: string;
  bookTitle: string;
  author: string;
  page?: number;
}): string {
  const where = input.page ? `${input.bookTitle} p.${input.page}` : input.bookTitle;
  return [
    `독자 레벨: ${input.level}`,
    `출처: ${where} (${input.author})`,
    '',
    '문장:',
    input.sentence,
  ].join('\n');
}
