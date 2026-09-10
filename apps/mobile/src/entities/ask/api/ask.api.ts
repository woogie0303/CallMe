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

export function useResolveAsk() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<ApiAskView>(`/asks/${id}/resolve`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: asksKey }),
  });
}

export type { ApiAsk, ApiAskView };
