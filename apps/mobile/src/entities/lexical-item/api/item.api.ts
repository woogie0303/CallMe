import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toBook } from '@/entities/book/api/book.api';
import type { Book } from '@/entities/book/model/types';
import { api } from '@/shared/api/client';
import type {
  ApiBook,
  ApiItem,
  ApiItemDetail,
  ApiSentence,
  ItemStatus,
  SaveItemResult,
} from '@/shared/api/types';
import { savedLabel } from '@/shared/lib/date';
import { sampleItems } from '../lib/sample';

/** 서랍의 한 줄에 필요한 것 전부 — 목록 한 번으로 온다 */
export type ItemSummary = {
  id: string;
  term: string;
  meaning: string;
  status: ItemStatus;
  /** 몇 번 만났는지. 둘 이상이면 재회다. */
  met: number;
  books: Book[];
  /**
   * 이 항목을 만난 문장들. 문장 피드가 밑줄을 놓을 자리를 여기서 찾는다 —
   * 문장→항목 방향 API가 없어서, 목록을 받아 앱에서 뒤집어 쓴다.
   */
  encounters: { sentenceId: string; surface?: string }[];
  /**
   * 가장 최근에 만난 문장. `sentenceId`가 있어야 `encounters`에서 그 문장에
   * 쳐진 밑줄(surface)을 찾을 수 있다 — 문장 안에 표현을 그리려면 필요하다.
   */
  latest?: {
    sentenceId: string;
    text: string;
    page?: number;
    bookTitle?: string;
    savedLabel: string;
  };
  /** 처음과 마지막 사이의 날수 — '2개월 만에'로 옮기는 일은 화면이 한다 */
  gapDays?: number;
};

type ApiItemSummary = {
  item: ApiItem;
  books: ApiBook[];
  latest: { sentence: ApiSentence; book: ApiBook | null } | null;
  gapDays?: number;
};

function toSummary(row: ApiItemSummary): ItemSummary {
  return {
    id: row.item._id,
    term: row.item.term,
    meaning: row.item.meaning,
    status: row.item.status,
    met: row.item.encounters.length,
    encounters: row.item.encounters.map((e) => ({
      sentenceId: e.sentenceId,
      surface: e.surface,
    })),
    gapDays: row.gapDays,
    books: row.books.map(toBook),
    latest: row.latest
      ? {
          sentenceId: row.latest.sentence._id,
          text: row.latest.sentence.text,
          page: row.latest.sentence.page,
          bookTitle: row.latest.book?.title,
          savedLabel: savedLabel(row.latest.sentence.createdAt),
        }
      : undefined,
  };
}

export const itemsKey = ['items'] as const;

export function useItems(params?: {
  status?: ItemStatus;
  reencountered?: boolean;
  bookId?: string;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.reencountered) search.set('reencountered', 'true');
  if (params?.bookId) search.set('bookId', params.bookId);
  const query = search.toString();

  return useQuery({
    queryKey: [...itemsKey, query],
    queryFn: async () => {
      const rows = (
        await api<ApiItemSummary[]>(`/items${query ? `?${query}` : ''}`)
      ).map(toSummary);
      /** 담아둔 것이 없으면 개발 빌드에서만 가짜 열 줄을 그린다. 배포에는 안 돈다. */
      if (__DEV__ && !rows.length && !query) return sampleItems();
      return rows;
    },
  });
}

export function useItem(id?: string) {
  return useQuery({
    queryKey: [...itemsKey, 'detail', id],
    enabled: Boolean(id),
    queryFn: () => api<ApiItemDetail>(`/items/${id}`),
  });
}

/** 담기 — 이미 있는 표현이면 서버가 재회로 돌려준다 */
export function useSaveItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      term: string;
      meaning: string;
      sentenceId: string;
      surface?: string;
    }) => api<SaveItemResult>('/items', { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useUpdateItem(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { status?: ItemStatus; meaning?: string }) =>
      api<ApiItem>(`/items/${id}`, { method: 'PATCH', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: itemsKey }),
  });
}

/**
 * 오늘 다시 볼 표현 하나. 아직 헷갈린다고 둔 것 중에서 처음과 마지막 사이가
 * 가장 벌어진 항목을 고른다 — 오래 잊고 지내다 또 걸린 표현일수록 오늘 다시
 * 꺼낼 이유가 크다.
 */
export function useTodayItem() {
  const query = useItems();
  const confused = (query.data ?? []).filter(
    (item) => item.status === '헷갈려요',
  );
  const today = [...confused].sort(
    (a, b) => (b.gapDays ?? 0) - (a.gapDays ?? 0),
  )[0];
  return { ...query, today };
}
