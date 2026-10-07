import { BadRequestException, type ValidationError } from '@nestjs/common';

/** 사람에게 보여줄 말인지 — 한글이 들어 있으면 우리가 쓴 메시지다 */
const korean = /[가-힣]/;

/** 중첩된 오류(문장 목록 안의 표현 등)까지 풀어서 메시지를 모은다 */
function collect(errors: ValidationError[], out: string[] = []): string[] {
  for (const error of errors) {
    out.push(...Object.values(error.constraints ?? {}));
    if (error.children?.length) collect(error.children, out);
  }
  return out;
}

/**
 * 검증 실패를 한국어로 돌려준다. class-validator의 기본 메시지는 영어
 * ('each value in picks must be shorter than…')라서 그대로 앱에 보이면 무슨 뜻인지
 * 알 수 없다. DTO에 한국어 `message`를 단 것은 그대로 쓰고, 달지 않은 것은 일반
 * 문장으로 바꾼다 — 원문은 서버 로그에서 찾는다(`onUnknown`).
 */
export function validationException(
  errors: ValidationError[],
  onUnknown?: (original: string) => void,
): BadRequestException {
  const messages = collect(errors);
  const shown: string[] = [];

  for (const message of messages) {
    if (korean.test(message)) {
      if (!shown.includes(message)) shown.push(message);
    } else {
      onUnknown?.(message);
    }
  }

  if (!shown.length) shown.push('입력한 내용이 올바르지 않아요.');
  return new BadRequestException(shown);
}
