import { NetworkError } from '@/shared/api/client';

/** 묻다가 실패했을 때 독자에게 보여줄 말 */
export type AskFailure = {
  title: string;
  message: string;
  /** 문장은 이미 담겨 있다 — 기다리는 문장으로 보내서 이어서 묻게 한다 */
  saved: boolean;
};

/**
 * 묻는 일이 실패한 이유를 독자의 말로 옮긴다.
 *
 * **답이 너무 늦은 경우(`late`)는 실패가 아니다.** 서버는 문장을 먼저 저장하고
 * 모델을 부르므로, 앱이 기다리기를 그만둬도 문장은 기다리는 문장에 서 있다. 오류
 * 창으로 막다른 길을 만드는 대신 그리로 보낸다(ADR-0003).
 */
export function explainAskError(error: unknown): AskFailure {
  if (error instanceof NetworkError && error.late) {
    return {
      title: '답이 늦어지고 있어요',
      message:
        '문장은 담겨 있어요. 기다리는 문장에서 잠시 뒤에 다시 물어볼 수 있어요.',
      saved: true,
    };
  }
  return {
    title: '묻지 못했어요',
    message: error instanceof Error ? error.message : '',
    saved: false,
  };
}
