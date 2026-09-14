import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { claudeFor, logUsage, ModelUnavailable, unavailable, type Claude } from '../../common/claude';

const SplitFormat = z.object({
  sentences: z
    .array(z.string())
    .describe('페이지에 있던 순서대로의 문장들. 원문 그대로, 고치지 않는다.'),
});

/**
 * OCR이 읽어낸 줄들을 문장으로 잇는다.
 *
 * 줄을 잇는 일을 앱에서 정규식으로 하지 않는 이유는 ADR-0002와 같다 — 문장을
 * 나누는 두 번째 조각을 두면 답을 내는 모델과 서로 다르게 자른다. 게다가 책
 * 페이지에는 줄 끝 하이픈, 쪽 번호, 머리글, 각주가 섞여 들어온다.
 */
const SYSTEM = `사진으로 찍은 책 페이지에서 글자 인식기가 읽어낸 조각들을 받습니다.
조각은 문장이 아니라 **줄**이라, 한 문장이 여러 줄에 걸쳐 있습니다.

하는 일은 이 줄들을 문장으로 다시 잇는 것뿐입니다.

- 줄 끝에서 하이픈으로 끊긴 낱말은 붙입니다 (under-\\nstand → understand).
- 쪽 번호, 머리글, 장 제목, 각주 번호처럼 본문이 아닌 것은 버립니다.
- **원문을 고치지 않습니다.** 맞춤법도, 어색한 표현도 그대로 둡니다. 인식기가
  잘못 읽은 글자를 짐작해서 고치지 않습니다 — 독자가 화면에서 눈으로 확인하고
  손으로 고칠 수 있고, 우리가 고치면 무엇이 바뀌었는지 아무도 모릅니다.
- 문장이 아니라 조각으로 끝나면(페이지가 문장 중간에서 끝남) 그 조각도 그대로 둡니다.
- 번역하지 않습니다. 요약하지 않습니다.`;

@Injectable()
export class SplitService {
  private readonly log = new Logger(SplitService.name);
  private readonly claude: Claude;

  constructor(config: ConfigService) {
    this.claude = claudeFor(config, 'SPLIT_MODEL', this.log);
  }

  async split(lines: string[]): Promise<string[]> {
    const { client, model } = this.claude;
    if (!client) throw new ModelUnavailable('AI가 설정되지 않았습니다.');

    try {
      const response = await client.messages.parse({
        model,
        max_tokens: 16000,
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: lines.join('\n') }],
        output_config: { format: zodOutputFormat(SplitFormat) },
      });

      logUsage(this.log, 'split', response.usage);

      if (response.stop_reason === 'refusal') {
        throw new ModelUnavailable('모델이 답을 거절했습니다.');
      }

      const parsed = response.parsed_output;
      if (!parsed) throw new ModelUnavailable('모델의 답을 읽지 못했습니다.');

      return parsed.sentences.map((sentence) => sentence.trim()).filter(Boolean);
    } catch (error) {
      throw unavailable(error, this.log);
    }
  }
}

/**
 * 모델이 답하지 않을 때 쓰는 거친 이음.
 *
 * 줄을 이어 붙이고 문장부호에서 자르기만 한다. Mr.이나 U.S. 같은 데서 잘못
 * 자르겠지만, 독자가 화면에서 고를 때 눈에 보이고 질문 화면에서 손으로 고칠 수
 * 있다. 찍는 일이 실패하는 것보다는 어긋난 문장이 낫다(ADR-0003).
 */
export function roughSplit(lines: string[]): string[] {
  const joined = lines
    /** 쪽 번호만 있는 줄은 본문이 아니다 — 모델이 없을 때 걸러낼 수 있는 건 이 정도다 */
    .filter((line) => !/^\s*[\divxlc]+\s*$/i.test(line))
    .join('\n')
    /** 줄 끝 하이픈은 낱말이 끊긴 것이다 */
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/\s*\n\s*/g, ' ')
    .trim();

  return joined
    .split(/(?<=[.!?”"])\s+(?=[“"A-Z])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1);
}
