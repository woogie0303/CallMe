export type Sentence = {
  id: string;
  bookId: string;
  page: number;
  /** 책에서 그대로 옮겨온 원문 */
  text: string;
  /** 이 문장을 담아둔 이유 — 내가 쓴 말 */
  note?: string;
  savedLabel: string;
};

/**
 * 문장은 어휘 항목과 별개의 기록이다. 어휘 항목이 딸리지 않은 문장(s9)은
 * 서랍이 아니라 책에 남는다 — 그냥 마음에 들어서 담아둔 줄이기 때문이다.
 */
export const SENTENCES: Sentence[] = [
  {
    id: 's1',
    bookId: 'klara',
    page: 132,
    text: '“She brushed it off and kept walking, as if nothing had happened.”',
    note: '조시가 화난 걸 클라라가 알아채는 장면',
    savedLabel: '어제',
  },
  {
    id: 's2',
    bookId: 'klara',
    page: 140,
    text: '“For the time being, we kept the blinds down and let the room stay dim.”',
    savedLabel: '어제',
  },
  {
    id: 's3',
    bookId: 'small-things',
    page: 41,
    text: '“We spent the better part of the evening in silence, and it was not unkind.”',
    note: '이런 문장을 쓰고 싶다',
    savedLabel: '8월 11일',
  },
  {
    id: 's4',
    bookId: 'remains',
    page: 74,
    text: '“He shrugged off the question and turned to the window.”',
    savedLabel: '2월 18일',
  },
  {
    id: 's5',
    bookId: 'klara',
    page: 133,
    text: '“I could just make out the Sun’s pattern on the far wall.”',
    savedLabel: '어제',
  },
  {
    id: 's6',
    bookId: 'piranesi',
    page: 88,
    text: '“I could not make out whether it was a statue or a person.”',
    savedLabel: '8월 20일',
  },
  {
    id: 's7',
    bookId: 'remains',
    page: 191,
    text: '“It took him years to come to terms with what he had chosen.”',
    savedLabel: '7월 12일',
  },
  {
    id: 's8',
    bookId: 'normal-people',
    page: 58,
    text: '“I had put up with the noise for the better part of a year.”',
    savedLabel: '6월 4일',
  },
  {
    id: 's9',
    bookId: 'klara',
    page: 121,
    text: '“The Sun always has ways to reach us.”',
    note: '그냥 이 문장이 좋았다',
    savedLabel: '8월 18일',
  },
];

export const sentenceById = (id: string) => SENTENCES.find((s) => s.id === id);

/** 서랍에 쌓인 전체 개수 — 목록은 그중 최근 것만 보여준다. */
export const SENTENCE_TOTAL = 128;
