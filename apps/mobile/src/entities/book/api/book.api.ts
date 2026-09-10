import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiBook } from '@/shared/api/types';
import { spineFor } from '../lib/spine';
import type { Book } from '../model/types';

/**
 * 서버의 책을 화면이 쓰는 모양으로 옮긴다.
 *
 * 책등 색이 비어 오는 경우가 있다(직접 등록한 책). 그때도 그라디언트는
 * 있어야 한다 — 라벨 없이 출처를 말하는 일을 이 색이 하기 때문이다.
 */
export function toBook(api: ApiBook): Book {
  const [from, to] = api.spine.length >= 2 ? api.spine : DEFAULT_SPINE;
  return {
    id: api._id,
    title: api.title,
    author: api.author,
    pages: api.pages ?? 0,
    cover: api.cover,
    spine: [from, to] as const,
  };
}

const DEFAULT_SPINE = ['#8E9AAF', '#5C6784'] as const;

export const booksKey = ['books'] as const;

export function useBooks() {
  return useQuery({
    queryKey: booksKey,
    queryFn: async () => (await api<ApiBook[]>('/books')).map(toBook),
  });
}

export function useBook(id?: string) {
  return useQuery({
    queryKey: ['books', id],
    enabled: Boolean(id),
    queryFn: async () => toBook(await api<ApiBook>(`/books/${id}`)),
  });
}

/** 지금 읽고 있는 책 — 다 읽지 않은 것 중 가장 최근에 편 것 */
export function useCurrentBook() {
  return useQuery({
    queryKey: [...booksKey, 'current'],
    queryFn: async () => {
      const books = await api<ApiBook[]>('/books?finished=false');
      const [first] = [...books].sort(byLastRead);
      return first ? { book: toBook(first), progress: first } : null;
    },
  });
}

function byLastRead(a: ApiBook, b: ApiBook): number {
  const at = new Date(a.lastReadAt ?? a.startedAt ?? 0).getTime();
  const bt = new Date(b.lastReadAt ?? b.startedAt ?? 0).getTime();
  return bt - at;
}

/**
 * 책을 서가에 들인다. 책등 색은 제목에서 정해 함께 보낸다 — 표지가 없어도
 * 문장 카드가 물려받을 색이 있어야 한다.
 */
export function useCreateBook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      author: string;
      pages?: number;
      currentPage?: number;
    }) => {
      const [from, to] = spineFor(input.title);
      return api<ApiBook>('/books', {
        method: 'POST',
        body: { ...input, spine: [from, to], startedAt: new Date().toISOString() },
      });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: booksKey }),
  });
}
