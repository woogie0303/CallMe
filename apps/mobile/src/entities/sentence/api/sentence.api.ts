import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiAskView, ApiSentence } from '@/shared/api/types';

/** 문장 하나 — 상세 화면이 서랍 목록 캐시에 기대지 않고 스스로 불러온다 */
export function useSentence(id?: string) {
  return useQuery({
    queryKey: ['sentences', 'one', id],
    enabled: Boolean(id),
    queryFn: () => api<ApiSentence>(`/sentences/${id}`),
  });
}

/**
 * 그 문장에 붙은 질문(번역과 후보). 물어본 적 없는 문장이면 빈 배열이다.
 * 키가 `asks`로 시작해서, 새로 물으면 질문 목록과 함께 다시 받는다.
 */
export function useSentenceAsk(id?: string) {
  return useQuery({
    queryKey: ['asks', 'sentence', id],
    enabled: Boolean(id),
    queryFn: () => api<ApiAskView[]>(`/asks?sentenceId=${id}&limit=20`),
    select: mergeAsks,
  });
}

/**
 * 같은 문장을 여러 번 물었을 수 있다 — 담아둔 문장을 **다시 골라서** 물으면 질문이 하나 더
 * 생긴다. 화면은 한 줄이라, 가장 최근에 답을 받은 질문을 바탕으로 하고 이전 질문에서
 * 고른 표현을 이어 붙인다. 그렇지 않으면 다시 물을 때마다 먼저 고른 표현이 문장 화면에서
 * 사라진다(서랍에는 남아 있는데도).
 *
 * 답을 받은 질문이 하나도 없으면(모두 기다리는 중) 가장 최근 것을 그대로 준다.
 */
function mergeAsks(views: ApiAskView[]): ApiAskView | null {
  if (!views.length) return null;
  const answered = views.filter((view) => view.ask.status === 'answered');
  if (!answered.length) return views[0];

  const [latest, ...older] = answered;
  const seen = new Set(latest.ask.picks.map((p) => p.surface.toLowerCase()));
  const extra = older
    .flatMap((view) => view.ask.picks)
    .filter((pick) => {
      const key = pick.surface.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return extra.length
    ? {
        ...latest,
        ask: { ...latest.ask, picks: [...latest.ask.picks, ...extra] },
      }
    : latest;
}

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
    mutationFn: (id: string) =>
      api<{ ok: true }>(`/sentences/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['sentences'] });
      /** 항목이 함께 사라졌을 수 있다 — 서랍의 밑줄도 다시 받는다 */
      client.invalidateQueries({ queryKey: ['items'] });
      client.invalidateQueries({ queryKey: ['asks'] });
    },
  });
}

/**
 * 이 문장에 생각 하나를 단다 / 지운다. 문장 화면이 쓰는 한 문장 캐시만 낡는다 —
 * 목록은 생각을 그리지 않는다.
 */
export function useAddThought(sentenceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      api<ApiSentence>(`/sentences/${sentenceId}/thoughts`, {
        method: 'POST',
        body: { text },
      }),
    onSuccess: (sentence) =>
      client.setQueryData(['sentences', 'one', sentenceId], sentence),
  });
}

export function useRemoveThought(sentenceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (thoughtId: string) =>
      api<ApiSentence>(`/sentences/${sentenceId}/thoughts/${thoughtId}`, {
        method: 'DELETE',
      }),
    onSuccess: (sentence) =>
      client.setQueryData(['sentences', 'one', sentenceId], sentence),
  });
}

/** 하트를 켜고 끈다 — 서랍의 갈래와 책의 '마음에 들었던 문장'이 함께 바뀐다 */
export function useFavoriteSentence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      api<ApiSentence>(`/sentences/${id}`, {
        method: 'PATCH',
        body: { favorite },
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['sentences'] });
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
