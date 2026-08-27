import type { Ask, AskQuota, PendingAsk } from './types';

/** 아직 답을 받지 않은, 방금 옮겨적은 문장 */
export const DRAFT_SENTENCE =
  '“From the way she held herself, I could make out that she had been putting the conversation off for the better part of a week.”';

export const DRAFT_BOOK_ID = 'klara';
export const DRAFT_PAGE = 147;

/**
 * 한 번 물으면 그 문장의 항목이 한꺼번에 돌아온다 — 항목마다 부르지 않는다.
 * 셋 중 둘은 이미 서랍에 있다. 담는 순간 재회가 된다.
 */
export const ASK_RESULT: Ask = {
  id: 'ask-1',
  text: DRAFT_SENTENCE,
  bookId: DRAFT_BOOK_ID,
  page: DRAFT_PAGE,
  translation:
    '그녀가 서 있는 모양새만 보고도, 그 대화를 일주일 가까이 미뤄왔다는 걸 알아볼 수 있었다.',
  candidates: [
    { id: 'c1', term: 'put off', meaning: '미루다, 뒤로 늦추다', register: '구어체' },
    {
      id: 'c2',
      term: 'make out',
      meaning: '겨우 알아보다, 분간하다',
      register: '중립',
      existingItemId: 'make-out',
    },
    {
      id: 'c3',
      term: 'the better part of',
      meaning: '~의 대부분, 거의 ~ 내내',
      register: '문어체',
      existingItemId: 'the-better-part-of',
    },
  ],
};

/** 두 번만 더 물으면 이번 달 질문이 떨어진다 — 그때부터는 문장만 쌓인다. */
export const ASK_QUOTA: AskQuota = { used: 28, limit: 30 };

export const remaining = (quota: AskQuota) => Math.max(0, quota.limit - quota.used);

/** 촬영한 페이지에서 OCR이 끊어낸 문장들, 페이지에 있던 순서대로. */
export type ScannedPage = {
  bookId: string;
  page: number;
  capturedLabel: string;
  sentences: string[];
};

export const SCANNED_PAGE: ScannedPage = {
  bookId: 'klara',
  page: 147,
  capturedLabel: '방금 촬영',
  sentences: [
    '“The Sun had come further into the room than usual, and Josie was still in bed.”',
    DRAFT_SENTENCE,
    '“I waited by the window and did not speak.”',
    '“When she finally sat up, she brushed it off with a small laugh, as if the morning had been nothing at all.”',
    '“For the time being, that was enough.”',
  ],
};

/**
 * 페이지의 문장마다 답이 하나씩 있다. 번역은 언제나 돌아오지만
 * 담아둘 만한 항목이 없는 문장도 있다 — 그것도 정상적인 답이다.
 */
export const ASKS: Ask[] = [
  {
    id: 'ask-0',
    text: SCANNED_PAGE.sentences[0],
    bookId: 'klara',
    page: 147,
    translation: '해가 여느 때보다 방 안쪽까지 들어와 있었고, 조시는 아직 침대에 있었다.',
    candidates: [],
  },
  ASK_RESULT,
  {
    id: 'ask-2',
    text: SCANNED_PAGE.sentences[2],
    bookId: 'klara',
    page: 147,
    translation: '나는 창가에서 기다렸고 아무 말도 하지 않았다.',
    candidates: [],
  },
  {
    id: 'ask-3',
    text: SCANNED_PAGE.sentences[3],
    bookId: 'klara',
    page: 147,
    translation:
      '마침내 몸을 일으켰을 때, 그녀는 아침이 아무 일도 아니었다는 듯 작게 웃으며 툭 털어냈다.',
    candidates: [
      {
        id: 'c4',
        term: 'brush it off',
        meaning: '별일 아닌 듯 넘기다, 툭툭 털어내다',
        register: '구어체',
        existingItemId: 'brush-it-off',
      },
      { id: 'c5', term: 'sit up', meaning: '몸을 일으켜 앉다', register: '중립' },
    ],
  },
  {
    id: 'ask-4',
    text: SCANNED_PAGE.sentences[4],
    bookId: 'klara',
    page: 147,
    translation: '당분간은 그걸로 충분했다.',
    candidates: [
      {
        id: 'c6',
        term: 'for the time being',
        meaning: '당분간은, 지금으로서는',
        register: '중립',
        existingItemId: 'for-the-time-being',
      },
    ],
  },
];

export const askForSentence = (text: string) => ASKS.find((a) => a.text === text);

/** 답을 기다리는 문장들. 쌓인 만큼이 곧 업그레이드할 이유다. */
export const PENDING_ASKS: PendingAsk[] = [
  {
    id: 'p1',
    text: '“The kitchen had the particular stillness of a room someone has just left.”',
    bookId: 'small-things',
    page: 63,
    capturedLabel: '오늘 아침',
    reason: '질문 소진',
  },
  {
    id: 'p2',
    text: '“He was forever putting things off until the light went.”',
    bookId: 'remains',
    page: 112,
    capturedLabel: '어제',
    reason: '오프라인',
  },
  {
    id: 'p3',
    text: '“She had a way of talking around a thing without ever landing on it.”',
    bookId: 'normal-people',
    page: 77,
    capturedLabel: '어제',
    reason: '질문 소진',
  },
];
