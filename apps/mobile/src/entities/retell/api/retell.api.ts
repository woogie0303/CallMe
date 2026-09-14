import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiRetell } from '@/shared/api/types';

export const retellsKey = ['retells'] as const;

export function useRetells(bookId?: string) {
  return useQuery({
    queryKey: [...retellsKey, bookId],
    enabled: Boolean(bookId),
    queryFn: () => api<ApiRetell[]>(`/retells?bookId=${bookId}`),
  });
}

export function useRetell(id?: string) {
  return useQuery({
    queryKey: [...retellsKey, 'one', id],
    enabled: Boolean(id),
    queryFn: () => api<ApiRetell>(`/retells/${id}`),
  });
}

/** 옮겨 적은 글은 답을 못 받아도 남는다 — 실패가 아니라 대기다 */
export function useCreateRetell() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { bookId: string; chapter: string; draft: string }) =>
      api<ApiRetell>('/retells', { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: retellsKey }),
  });
}

/** 기다리던 리텔링을 다시 시도한다 — 연결이 돌아왔을 때 */
export function useResolveRetell() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<ApiRetell>(`/retells/${id}/resolve`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: retellsKey }),
  });
}

export type { ApiRetell };
