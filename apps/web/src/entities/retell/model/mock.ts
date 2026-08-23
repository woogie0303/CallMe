export type RetellRevision = {
  id: string;
  /** 내가 말한 그대로 */
  mine: string;
  /** 이렇게 말하면 더 자연스러워요 */
  better: string;
  /** 무엇을 왜 고쳤는지 */
  note: string;
  /** note 안에서 굵게 짚어줄 조각들 */
  highlights: string[];
};

export type RetellSession = {
  bookId: string;
  chapter: string;
  durationLabel: string;
  transcript: string;
  /** 파형 — 0~100 */
  waveform: number[];
  revisions: RetellRevision[];
  missedExpressionIds: string[];
};

export const RETELL_SESSION: RetellSession = {
  bookId: 'klara',
  chapter: 'Chapter 12',
  durationLabel: '0:38',
  transcript:
    '“Klara watched the sun going down and she thought the sun will help Josie because the sun gave her power…”',
  waveform: [
    6, 8, 7, 18, 26, 23, 19, 36, 30, 39, 43, 36, 48, 15, 25, 28, 31, 19, 44, 62,
    56, 29, 35, 53, 45, 28, 55, 47, 64, 80, 36, 62, 71, 51, 30, 81, 31, 51, 51, 63,
    39, 57, 93, 80, 53, 35, 69, 27, 33, 54, 35, 45, 44, 93, 79, 58, 99, 87, 65, 100,
    53, 61, 29, 70, 59, 88, 28, 62, 43, 26, 82, 81, 88, 73, 42, 91, 79, 77, 32, 30,
    84, 50, 29, 35, 74, 28, 50, 45, 76, 43, 45, 39, 42, 76, 30, 31, 34, 56, 33, 40,
    25, 56, 52, 45, 48, 34, 32, 15, 28, 36, 20, 10, 17, 31, 14, 15, 7, 15, 6, 6,
  ],
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
  missedExpressionIds: ['brush-it-off', 'for-the-time-being', 'make-out'],
};
