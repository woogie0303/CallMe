export type Register = '구어체' | '중립' | '문어체';

/** 어휘 항목을 한 문장에서 만난 일. 두 번째부터가 재회다. */
export type Encounter = {
  sentenceId: string;
  savedOn: string;
  savedLabel: string;
};

export type LexicalItem = {
  id: string;
  /** 표제형(canonical form) — 언제나 세리프로 조판한다. */
  term: string;
  /** 레벨에 맞춰 쓰인 뜻이라 사람마다 다를 수 있다. */
  meaning: string;
  register: Register;
  /**
   * 이 항목을 만난 문장들, 오래된 것부터. 항목은 책에 속하지 않는다 —
   * 여러 책을 건너다니는 것이 어휘 항목이고, 그 이동이 곧 재회다.
   */
  encounters: Encounter[];
  status: '헷갈려요' | '외웠어요';
  /** 예전에 담아둔, 헷갈리기 쉬운 다른 항목 */
  confusedWith?: { itemId: string; note: string };
};
