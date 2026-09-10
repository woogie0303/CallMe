import { useQuery } from '@tanstack/react-query';
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
