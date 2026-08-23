export type QuizQuestion = {
  id: string;
  bookId: string;
  page: number;
  /** 빈칸 앞/뒤 원문 */
  before: string;
  after: string;
  answer: string;
  choices: string[];
  /** 이 문장을 언제 물어봤는지 */
  askedLabel: string;
  /** 정답을 고른 뒤 보여줄 대조 */
  contrast: { left: string; right: string; note: string };
};

export const QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    bookId: 'klara',
    page: 132,
    before: '“She just',
    after: 'it off and kept walking, as if nothing had happened.”',
    answer: 'brushed',
    choices: ['shrugged', 'brushed', 'waved', 'shook'],
    askedLabel: '2월 18일에 물어본 문장이에요',
    contrast: {
      left: 'shrug off',
      right: 'brush off',
      note: 'shrug off는 어깨를 으쓱하는 무관심에 가깝고, brush off는 손으로 털어내듯 상대의 말을 흘려보내는 쪽이에요.',
    },
  },
];

export const QUIZ_TOTAL = 5;
export const QUIZ_INDEX = 2;
