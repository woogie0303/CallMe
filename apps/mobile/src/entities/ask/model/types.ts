import type { Register } from '@/entities/lexical-item/model/types';

/**
 * AI가 문장에서 골라준 항목. 아직 서랍에 들어간 게 아니라 제안일 뿐이고,
 * 읽는 사람이 고르는 순간 어휘 항목이 된다.
 */
export type Candidate = {
  id: string;
  term: string;
  meaning: string;
  register: Register;
  /**
   * 이미 서랍에 있는 항목이면 그 id. 이걸 고르면 새 기록이 생기는 게 아니라
   * 기존 항목에 문장이 하나 더 붙는다 — 그게 재회다.
   */
  existingItemId?: string;
};

/**
 * 질문의 단위는 언제나 문장 하나다. 낱말만 따로 묻지 않는다 —
 * 문장을 떼면 어느 뜻인지 고를 수가 없기 때문이다. (docs/adr/0001)
 */
export type Ask = {
  id: string;
  /** 물어본 문장, 책에 있던 그대로 */
  text: string;
  bookId?: string;
  page?: number;
  /** 앱이 하는 말이라 세리프가 아니다 */
  translation: string;
  candidates: Candidate[];
};

/** 이번 달 남은 질문. 다 쓰면 문장은 그대로 담기고 답만 나중에 온다. */
export type AskQuota = {
  used: number;
  limit: number;
};

/**
 * 답을 받지 못한 채 담아둔 문장. 신호가 없었거나 이번 달 질문이 떨어졌거나 —
 * 어느 쪽이든 담는 일은 실패하지 않는다. 읽던 흐름이 끊기는 것이
 * 이 앱이 막으려는 바로 그 일이기 때문이다. (Q27)
 */
export type PendingAsk = {
  id: string;
  text: string;
  bookId?: string;
  page?: number;
  capturedLabel: string;
  reason: '질문 소진' | '오프라인';
};
