import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiAsk, ApiAskView, ApiQuota } from '@/shared/api/types';

export const asksKey = ['asks'] as const;
export const quotaKey = ['asks', 'quota'] as const;

/** 이번 달 남은 질문. 다 써도 문장은 그대로 담긴다. */
export function useAskQuota() {
  return useQuery({
    queryKey: quotaKey,
    queryFn: () => api<ApiQuota>('/asks/quota'),
  });
}

/** 답을 기다리는 문장들 */
export function usePendingAsks() {
  return useQuery({
    queryKey: [...asksKey, 'pending'],
    queryFn: () => api<ApiAskView[]>('/asks?status=pending'),
  });
}

export function useAsk(id?: string) {
  return useQuery({
    queryKey: [...asksKey, id],
    enabled: Boolean(id),
    queryFn: () => api<ApiAskView>(`/asks/${id}`),
  });
}

/**
 * 묻는 두 가지 길.
 *
 * - `{ bookId, text }` — 방금 옮겨 적은 문장. 서버가 문장을 먼저 만들고 묻는다.
 * - `{ sentenceId }` — **이미 담아둔 문장**을 나중에 묻는다(ADR-0004). 이쪽으로
 *   보내야 같은 글이 두 줄이 되지 않는다. 책과 쪽수는 그 문장이 이미 안다.
 */
export type AskInput =
  { bookId: string; text: string; page?: number } | { sentenceId: string };

/**
 * 문장을 통째로 묻는다. 답을 못 받아도 실패가 아니다 — 문장은 저장되고
 * 질문은 pending으로 남는다. 그래서 오류를 띄우는 대신 상태를 보여준다.
 */
export function useCreateAsk() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: AskInput) =>
      api<ApiAskView>('/asks', { method: 'POST', body }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: asksKey });
      client.invalidateQueries({ queryKey: ['sentences'] });
      /** 담기면 밑줄이 생길 수 있어서 항목 목록도 다시 받는다 */
      client.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

/**
 * 찍은 쪽에서 읽어낸 줄들을 문장으로 잇는다.
 *
 * 앱에서 정규식으로 자르지 않는 이유는, 문장을 나누는 두 번째 조각을 두면
 * 답을 내는 모델과 서로 다르게 자르기 때문이다(ADR-0002). `rough`가 참이면
 * 모델이 답하지 않아 서버가 거칠게 이어 준 것이라, 문장이 어긋나 있을 수 있다.
 */
export function useSplitLines() {
  return useMutation({
    mutationFn: (lines: string[]) =>
      api<{ sentences: string[]; rough: boolean }>('/asks/split', {
        method: 'POST',
        body: { lines },
      }),
  });
}

export function useResolveAsk() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<ApiAskView>(`/asks/${id}/resolve`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: asksKey }),
  });
}

export type { ApiAsk, ApiAskView };

/** 광고를 끝까지 보고 질문을 더 받는다. 한도가 남아 있으면 서버가 거절한다. */
export function useClaimAdBonus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<ApiQuota>('/asks/quota/ad-bonus', { method: 'POST' }),
    onSuccess: (quota) => client.setQueryData(quotaKey, quota),
  });
}
