export type Expression = {
  id: string;
  /** 표현 자체 — 언제나 세리프로 조판한다. */
  term: string;
  meaning: string;
  /** 책에서 이 표현이 쓰인 문장 */
  example: string;
  bookId: string;
  page: number;
  /** 처음 물어본 날 */
  askedOn: string;
  askedLabel: string;
  status: '헷갈려요' | '외웠어요';
  /** 예전에 물어본, 헷갈리기 쉬운 표현 */
  confusedWith?: { expressionId: string; note: string };
};
