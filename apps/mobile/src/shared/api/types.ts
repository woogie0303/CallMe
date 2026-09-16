/**
 * 서버가 돌려주는 모양. 화면이 쓰는 타입과 따로 두는 이유는, 서버가 바꾼 것과
 * 화면이 바꾼 것이 한 파일에서 섞이면 어느 쪽이 원본인지 알 수 없어지기 때문이다.
 * 여기 있는 것이 원본이고, 화면 쪽 타입은 이걸 좁힌 것이다.
 */
export type Level = '입문' | '중급' | '고급';
export type Register = '구어체' | '중립' | '문어체';
export type ItemStatus = '헷갈려요' | '외웠어요';
export type ProviderName = 'kakao' | 'naver' | 'google';

export type ReaderView = {
  id: string;
  nickname: string;
  email?: string;
  profileImage?: string;
  level: Level;
  booksFinished: number;
  providers: ProviderName[];
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type SignInResult = Tokens & { reader: ReaderView };

export type ApiBook = {
  _id: string;
  title: string;
  author: string;
  pages?: number;
  cover?: string;
  spine: string[];
  currentPage: number;
  startedAt?: string;
  lastReadAt?: string;
  finishedAt?: string;
};

export type ApiSentence = {
  _id: string;
  bookId: string;
  text: string;
  page?: number;
  note?: string;
  createdAt: string;
};

export type ApiEncounter = {
  sentenceId: string;
  surface?: string;
  savedAt: string;
};

export type ApiItem = {
  _id: string;
  term: string;
  meaning: string;
  register: Register;
  status: ItemStatus;
  encounters: ApiEncounter[];
  confusedWith?: { itemId: string; note: string };
  createdAt: string;
  updatedAt: string;
};

export type ApiItemDetail = {
  item: ApiItem;
  encounters: {
    sentenceId: string;
    savedAt: string;
    sentence: ApiSentence | null;
    book: ApiBook | null;
  }[];
};

export type ApiCandidate = {
  term: string;
  surface?: string;
  meaning: string;
  register: Register;
  existingItemId?: string;
  /** 이미 서랍에 있던 표현일 때만 — 담는 순간이 재회가 된다 */
  existing?: { met: number; lastSavedAt?: string; lastBookTitle?: string };
};

export type ApiAsk = {
  _id: string;
  sentenceId: string;
  status: 'answered' | 'pending';
  translation?: string;
  candidates: ApiCandidate[];
  pendingReason?: '질문 소진' | '연결 실패';
  answeredAt?: string;
  createdAt: string;
};

export type ApiAskView = {
  ask: ApiAsk;
  sentence: ApiSentence | null;
  book: ApiBook | null;
};

export type ApiQuota = {
  used: number;
  limit: number;
  remaining: number;
  resetsOn: string;
};

export type ApiRetell = {
  _id: string;
  bookId: string;
  chapter: string;
  draft: string;
  revisions: { mine: string; better: string; note: string; highlights: string[] }[];
  missedTerms: string[];
  status: 'answered' | 'pending';
  pendingReason?: '횟수 소진' | '연결 실패';
  createdAt: string;
};

export type SaveItemResult = {
  item: ApiItem;
  reencountered: boolean;
  /** 처음 만난 날과 이번 사이의 날수 — '2개월 만에'로 옮기는 일은 앱이 한다 */
  gapDays?: number;
  previousSavedAt?: string;
  previousSentenceId?: string;
};
