import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiQuizQuestion, ApiQuizResult } from '@/shared/api/types';

export const quizKey = ['quiz'] as const;

/**
 * 오늘 낼 문제들. 빈 배열이면 낼 문제가 없다는 뜻이다 — 담은 게 적거나,
 * 담아둔 것들이 아직 쉬는 중이다.
 *
 * 새로 고치지 않는다. 한 문제 풀 때마다 목록이 갈리면 풀던 자리가 사라진다.
 */
export function useQuizSession(size = 5) {
  return useQuery({
    queryKey: [...quizKey, size],
    queryFn: () => api<ApiQuizQuestion[]>(`/quiz?size=${size}`),
    staleTime: Infinity,
    refetchOnMount: false,
  });
}

export function useAnswerQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemId: string; sentenceId: string; choiceItemId: string }) =>
      api<ApiQuizResult>('/quiz/answers', { method: 'POST', body }),
    /** 맞고 틀림이 서랍의 상태를 바꾼다 */
    onSuccess: () => client.invalidateQueries({ queryKey: ['items'] }),
  });
}

export type { ApiQuizQuestion, ApiQuizResult };
