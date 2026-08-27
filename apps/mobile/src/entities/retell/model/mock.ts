export type RetellRevision = {
  id: string;
  /** 내가 쓴 그대로 */
  mine: string;
  /** 이렇게 쓰면 더 자연스러워요 */
  better: string;
  /** 무엇을 왜 고쳤는지 */
  note: string;
  /** note 안에서 굵게 짚어줄 조각들 */
  highlights: string[];
};

/**
 * 읽은 챕터를 제 말로 옮겨 적는 일. 말하기(음성·STT)는 MVP에서 뺐다 —
 * 읽기를 돕는 앱에 말하기 훈련이 붙으면 만들 것이 두 배가 된다. (Q20)
 */
export type RetellSession = {
  bookId: string;
  chapter: string;
  /** 내가 옮겨 적은 줄거리 */
  draft: string;
  revisions: RetellRevision[];
  /** 이 챕터에서 쓸 수 있었던, 내가 담아둔 항목 */
  missedItemIds: string[];
};

export const RETELL_SESSION: RetellSession = {
  bookId: 'klara',
  chapter: 'Chapter 12',
  draft:
    'Klara watched the sun going down and she thought the sun will help Josie because the sun gave her power. Josie was very sad and she did not say anything.',
  revisions: [
    {
      id: 'r1',
      mine: 'the sun will help Josie because the sun gave her power',
      better: 'the sun would heal Josie, since it had given her strength before',
      note: '과거 이야기를 옮길 땐 시제를 맞춰 would로 쓰면 자연스러워요. 반복되는 the sun은 it으로 받아주세요.',
      highlights: ['would', 'the sun', 'it'],
    },
    {
      id: 'r2',
      mine: 'she was very sad and she did not say anything',
      better: 'she went quiet, the way she does when something has hurt her',
      note: 'very sad처럼 감정을 직접 말하기보다, 인물이 한 행동으로 보여주면 원서의 톤에 가까워져요.',
      highlights: ['went quiet', 'very sad'],
    },
  ],
  missedItemIds: ['brush-it-off', 'for-the-time-being', 'make-out'],
};
