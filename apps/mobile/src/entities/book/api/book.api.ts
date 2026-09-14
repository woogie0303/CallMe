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

/** 읽고 있는 책들 — 가장 최근에 편 것이 앞에 선다 */
export function useReadingBooks() {
  return useQuery({
    queryKey: [...booksKey, 'reading'],
    queryFn: async () => {
      const books = await api<ApiBook[]>('/books?finished=false');
      return [...books].sort(byLastRead).map((raw) => ({ book: toBook(raw), progress: raw }));
    },
  });
}

/**
 * 맨 위에 크게 서는 한 권 — 가장 최근에 읽은 책이다.
 *
 * 이 자리는 책을 새로 들인다고 바뀌지 않는다. 진도를 옮길 때 바뀐다 —
 * 등록만으로 밀려나면 어제까지 읽던 쪽이 어디로 갔는지 알 수 없어진다.
 */
export function useCurrentBook() {
  const query = useReadingBooks();
  return { ...query, data: query.data ? (query.data[0] ?? null) : undefined };
}

function byLastRead(a: ApiBook, b: ApiBook): number {
  const at = new Date(a.lastReadAt ?? a.startedAt ?? 0).getTime();
  const bt = new Date(b.lastReadAt ?? b.startedAt ?? 0).getTime();
  return bt - at;
}

/**
 * 책을 서가에 들인다. 책등 색은 제목에서 정해 함께 보낸다 — 검색으로 찾아
 * 표지가 있어도 색은 함께 보낸다. 표지를 못 받아오는 순간에도(주소가 죽거나
 * 오프라인이거나) 출처를 말하는 일을 이 색이 대신해야 하기 때문이다.
 */
export function useCreateBook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      author: string;
      pages?: number;
      currentPage?: number;
      cover?: string;
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

export type BookSearchResult = {
  title: string;
  author: string;
  pages?: number;
  cover?: string;
  publisher?: string;
};

/**
 * 책을 검색한다. 서버가 외부 API를 대신 불러준다 — 키를 앱에 박지 않고,
 * CORS도 앱이 신경 쓸 일이 아니게 된다.
 */
export function useBookSearch(query: string) {
  return useQuery({
    queryKey: ['books', 'search', query],
    enabled: query.trim().length > 1,
    queryFn: () => api<BookSearchResult[]>(`/books/search?q=${encodeURIComponent(query.trim())}`),
    /** 같은 말을 다시 치면 캐시로 즉시 보여준다 — 검색은 왔다 갔다 하는 화면이다 */
    staleTime: 60_000,
  });
}
