import { BadRequestException } from '@nestjs/common';

/**
 * 쪽수가 그 책 안에 있는지. 책의 쪽수를 모르면(손으로 들인 책은 선택이다)
 * 따지지 않는다.
 *
 * 앱도 막지만 서버가 한 번 더 막는다 — 문장의 쪽수는 나중에 그 문장을 다시 찾을
 * 때 붙잡는 유일한 곳이라, 책에 없는 쪽이 한 번 들어가면 그 문장은 찾을 길이 없다.
 */
export function assertPageInBook(book: { pages?: number }, page?: number): void {
  if (page === undefined || !book.pages) return;
  if (page > book.pages) {
    throw new BadRequestException(`이 책은 ${book.pages}쪽까지예요.`);
  }
}
