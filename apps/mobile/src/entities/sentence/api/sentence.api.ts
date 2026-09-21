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
 * 문장 하나를 지운다. **문장만 지워지지 않는다** — 서버가 그 문장을 가리키던
 * 만남을 모든 항목에서 빼고, 만남이 하나도 안 남은 항목은 통째로 지운다.
 * 무엇이 함께 사라지는지는 `lib/delete-impact.ts`가 세고, 묻는 일은 화면이 한다.
 */
export function useDeleteSentence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/sentences/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['sentences'] });
      /** 항목이 함께 사라졌을 수 있다 — 서랍의 밑줄도 다시 받는다 */
      client.invalidateQueries({ queryKey: ['items'] });
      client.invalidateQueries({ queryKey: ['asks'] });
    },
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
