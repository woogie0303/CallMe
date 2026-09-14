import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiSentence } from '@/shared/api/types';

/**
 * 그냥 좋아서 담아둔 문장들 — 어휘 항목도, 기다리는 질문도 딸리지 않은 줄.
 * 어느 쪽인지는 서버가 판단한다. 문장에 표시해 두면 표현을 담고 지울 때마다
 * 어긋나기 때문이다.
 */
export function useLikedSentences(bookId?: string) {
  return useQuery({
    queryKey: ['sentences', 'liked', bookId],
    enabled: Boolean(bookId),
    queryFn: () => api<ApiSentence[]>(`/sentences?bookId=${bookId}&liked=true`),
  });
}

/**
 * 뜻을 묻지 않고 문장만 담는다 — 몰라서가 아니라 그냥 좋아서 담아둔 줄.
 *
 * 어휘 항목이 딸리지 않으므로 서랍에는 걸릴 데가 없고 그 책에 남는다(Q25).
 * 질문 횟수를 쓰지 않는다 — 모델을 부르지 않으니까.
 */
export function useCreateSentence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { bookId: string; text: string; page?: number }) =>
      api<ApiSentence>('/sentences', { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['sentences'] }),
  });
}
