import type { LexicalItem } from './types';

/**
 * `make out`과 `the better part of`는 두 번씩 만났다 — 서로 다른 책에서.
 * 서랍이 북모리와 갈라지는 지점이 정확히 이 두 항목이다.
 */
export const ITEMS: LexicalItem[] = [
  {
    id: 'make-out',
    term: 'make out',
    meaning: '겨우 알아보다, 분간하다',
    register: '중립',
    status: '헷갈려요',
    encounters: [
      { sentenceId: 's6', savedOn: '2026-08-20', savedLabel: '8월 20일' },
      { sentenceId: 's5', savedOn: '2026-08-26', savedLabel: '어제' },
    ],
  },
  {
    id: 'brush-it-off',
    term: 'brush it off',
    meaning: '별일 아닌 듯 넘기다, 툭툭 털어내다',
    register: '구어체',
    status: '헷갈려요',
    encounters: [{ sentenceId: 's1', savedOn: '2026-08-26', savedLabel: '어제' }],
    confusedWith: {
      itemId: 'shrug-off',
      note: 'shrug off는 어깨를 으쓱하는 무관심에 가깝고, brush off는 손으로 털어내듯 상대의 말을 흘려보내는 쪽이에요.',
    },
  },
  {
    id: 'the-better-part-of',
    term: 'the better part of',
    meaning: '~의 대부분, 거의 ~ 내내',
    register: '문어체',
    status: '헷갈려요',
    encounters: [
      { sentenceId: 's8', savedOn: '2026-06-04', savedLabel: '6월 4일' },
      { sentenceId: 's3', savedOn: '2026-08-11', savedLabel: '8월 11일' },
    ],
  },
  {
    id: 'for-the-time-being',
    term: 'for the time being',
    meaning: '당분간은, 지금으로서는',
    register: '중립',
    status: '헷갈려요',
    encounters: [{ sentenceId: 's2', savedOn: '2026-08-26', savedLabel: '어제' }],
  },
  {
    id: 'come-to-terms-with',
    term: 'come to terms with',
    meaning: '받아들이게 되다, 마음으로 정리하다',
    register: '문어체',
    status: '헷갈려요',
    encounters: [{ sentenceId: 's7', savedOn: '2026-07-12', savedLabel: '7월 12일' }],
  },
  {
    id: 'shrug-off',
    term: 'shrug off',
    meaning: '대수롭지 않게 여기다, 무시해 버리다',
    register: '구어체',
    status: '외웠어요',
    encounters: [{ sentenceId: 's4', savedOn: '2026-02-18', savedLabel: '2월 18일' }],
    confusedWith: {
      itemId: 'brush-it-off',
      note: '6개월 뒤 Klara에서 brush it off를 만나며 다시 헷갈렸어요.',
    },
  },
  {
    id: 'put-up-with',
    term: 'put up with',
    meaning: '참고 견디다',
    register: '구어체',
    status: '외웠어요',
    encounters: [{ sentenceId: 's8', savedOn: '2026-06-04', savedLabel: '6월 4일' }],
  },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);
