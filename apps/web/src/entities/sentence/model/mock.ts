export type Sentence = {
  id: string;
  bookId: string;
  page: number;
  /** 책에서 옮겨온 원문 */
  text: string;
  /** 이 문장을 담아둔 이유 — 내가 쓴 말 */
  note?: string;
  savedLabel: string;
};

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
    page: 191,
    text: '“It took him years to come to terms with what he had chosen.”',
    savedLabel: '7월 12일',
  },
];
