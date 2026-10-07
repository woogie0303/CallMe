import type { ValidationError } from '@nestjs/common';
import { validationException } from './validation';

const error = (
  constraints: Record<string, string>,
  children: ValidationError[] = [],
): ValidationError => ({ property: 'x', constraints, children });

describe('validationException', () => {
  it('한국어로 쓴 메시지는 그대로 보여준다', () => {
    const result = validationException([
      error({ maxLength: '고른 표현은 120자까지만 받아요.' }),
    ]);
    expect(result.getResponse()).toMatchObject({
      message: ['고른 표현은 120자까지만 받아요.'],
    });
  });

  it('영어 기본 메시지는 일반 문장으로 바꾸고 원문은 알린다', () => {
    const seen: string[] = [];
    const result = validationException(
      [error({ maxLength: 'each value in picks must be shorter than 120' })],
      (original) => seen.push(original),
    );
    expect(result.getResponse()).toMatchObject({
      message: ['입력한 내용이 올바르지 않아요.'],
    });
    expect(seen).toEqual(['each value in picks must be shorter than 120']);
  });

  it('중첩된 오류와 겹치는 메시지를 한 번씩만 모은다', () => {
    const result = validationException([
      error({ a: '문장은 1,000자까지만 받아요.' }, [
        error({ a: '문장은 1,000자까지만 받아요.' }),
        error({ b: 'must be a string' }),
      ]),
    ]);
    expect(result.getResponse()).toMatchObject({
      message: ['문장은 1,000자까지만 받아요.'],
    });
  });
});
