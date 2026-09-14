import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiAsk, ApiAskView, ApiQuota } from '@/shared/api/types';

export const asksKey = ['asks'] as const;
export const quotaKey = ['asks', 'quota'] as const;

/** 이번 달 남은 질문. 다 써도 문장은 그대로 담긴다. */
export function useAskQuota() {
  return useQuery({ queryKey: quotaKey, queryFn: () => api<ApiQuota>('/asks/quota') });
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
 * 문장을 통째로 묻는다. 답을 못 받아도 실패가 아니다 — 문장은 저장되고
 * 질문은 pending으로 남는다. 그래서 오류를 띄우는 대신 상태를 보여준다.
 */
export function useCreateAsk() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { bookId: string; text: string; page?: number }) =>
      api<ApiAskView>('/asks', { method: 'POST', body }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: asksKey });
      client.invalidateQueries({ queryKey: ['sentences'] });
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
    mutationFn: (id: string) => api<ApiAskView>(`/asks/${id}/resolve`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: asksKey }),
  });
}

export type { ApiAsk, ApiAskView };
