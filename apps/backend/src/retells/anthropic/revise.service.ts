import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { claudeFor, logUsage, ModelUnavailable, unavailable, type Claude } from '../../common/claude';

const ReviseFormat = z.object({
  revisions: z
    .array(
      z.object({
        mine: z
          .string()
          .describe('내가 쓴 글에서 그대로 잘라낸 조각. 없는 말을 지어내지 않는다.'),
        better: z.string().describe('같은 뜻을 더 자연스럽게 쓴 영어.'),
        note: z.string().describe('무엇을 왜 고쳤는지 한국어로 한두 문장.'),
        highlights: z
          .array(z.string())
          .describe('note 안에서 굵게 짚어줄 조각들. note에 실제로 들어 있는 말만.'),
      }),
    )
    .describe('고칠 곳. 많아도 셋까지. 고칠 것이 없으면 빈 배열.'),
  missedTerms: z
    .array(z.string())
    .describe(
      '아래 목록에 있는 표현 중, 이 글에서 쓸 수 있었는데 쓰지 않은 것들의 표제형. ' +
        '목록에 없는 표현은 절대 만들지 않는다. 해당 없으면 빈 배열.',
    ),
});

export type Revised = z.infer<typeof ReviseFormat>;

/**
 * 붙박이 부분. 요청마다 달라지는 것(챕터·레벨·글·담아둔 표현)은 user 메시지로 간다.
 */
const SYSTEM = `당신은 영어 원서를 읽는 한국어 사용자의 글을 고쳐 주는 사람입니다.

독자가 방금 읽은 챕터를 제 말로 옮겨 적었습니다. 문법 시험을 채점하는 것이 아니라,
**그 사람이 쓴 문장을 그대로 두고 어디를 어떻게 바꾸면 자연스러워지는지** 보여줍니다.

지킬 것:

- mine에는 독자가 쓴 글에서 **그대로 잘라낸 조각**만 넣습니다. 고쳐 쓴 말이나
  요약을 넣지 않습니다. 화면이 두 줄을 나란히 놓고 비교하기 때문입니다.
- 한 번에 셋까지만 고칩니다. 스무 군데를 짚으면 아무 데도 고치지 못합니다.
  가장 크게 어색한 것부터 고릅니다.
- 틀린 문법만 보지 않습니다. 문법이 맞아도 원어민이 그렇게 쓰지 않는 자리
  (very sad처럼 감정을 직접 말하는 것)를 더 중요하게 봅니다.
- note는 한국어로, 왜 그렇게 쓰는지가 남게 씁니다. '틀렸어요'가 아니라
  '이럴 땐 이렇게 씁니다'로 씁니다.
- 고칠 것이 정말 없으면 빈 배열을 돌려줍니다. 억지로 고치지 않습니다.
- missedTerms에는 **주어진 목록에 있는 표현만** 넣습니다. 목록에 없는 표현을
  지어내면, 담은 적 없는 것을 담았다고 말하는 셈이 됩니다.`;

@Injectable()
export class ReviseService {
  private readonly log = new Logger(ReviseService.name);
  private readonly claude: Claude;

  constructor(config: ConfigService) {
    this.claude = claudeFor(config, 'RETELL_MODEL', this.log);
  }

  get modelName(): string {
    return this.claude.model;
  }

  async revise(input: {
    chapter: string;
    draft: string;
    level: string;
    bookTitle: string;
    /** 이 책에서 담아둔 표현들 — 여기 있는 것만 '쓸 수 있었다'고 말할 수 있다 */
    savedTerms: string[];
  }): Promise<Revised> {
    const { client, model } = this.claude;
    if (!client) throw new ModelUnavailable('AI가 설정되지 않았습니다.');

    try {
      const response = await client.messages.parse({
        model,
        max_tokens: 16000,
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt(input) }],
        output_config: { format: zodOutputFormat(ReviseFormat) },
      });

      logUsage(this.log, 'retell', response.usage);

      if (response.stop_reason === 'refusal') {
        throw new ModelUnavailable(
          `모델이 답을 거절했습니다: ${response.stop_details?.category ?? '이유 없음'}`,
        );
      }

      const parsed = response.parsed_output;
      if (!parsed) throw new ModelUnavailable('모델의 답을 읽지 못했습니다.');

      /** 목록에 없는 표현은 버린다 — 프롬프트로 막고, 여기서 한 번 더 막는다 */
      const allowed = new Set(input.savedTerms);
      return {
        revisions: parsed.revisions,
        missedTerms: parsed.missedTerms.filter((term) => allowed.has(term)),
      };
    } catch (error) {
      throw unavailable(error, this.log);
    }
  }
}

function userPrompt(input: {
  chapter: string;
  draft: string;
  level: string;
  bookTitle: string;
  savedTerms: string[];
}): string {
  return [
    `독자 레벨: ${input.level}`,
    `책: ${input.bookTitle} · ${input.chapter}`,
    '',
    '이 책에서 담아둔 표현:',
    input.savedTerms.length ? input.savedTerms.map((term) => `- ${term}`).join('\n') : '- (없음)',
    '',
    '독자가 옮겨 적은 글:',
    input.draft,
  ].join('\n');
}
