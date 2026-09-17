import { useQuery } from '@tanstack/react-query';

import { useBooks } from '@/entities/book/api/book.api';
import { useItems } from '@/entities/lexical-item/api/item.api';
import { api } from '@/shared/api/client';
import type { ApiAskView, ApiSentence } from '@/shared/api/types';
import { sampleFeed } from '@/entities/lexical-item/lib/sample';
import { buildFeed } from '../lib/feed';

/** 한 번에 받아오는 문장 수. 서버에 페이지네이션이 없어서 여기서 끊는다. */
const FEED_LIMIT = 200;

/**
 * 서랍에 쌓이는 문장들(ADR-0004).
 *
 * 원천이 둘인데 서로 겹치지 않는다. 서버가 `liked`를 "어휘 항목도 질문도
 * 붙지 않은 문장"으로 정의하기 때문이다 — 물어본 문장은 `/asks`에만, 그냥
 * 담아둔 문장은 `/sentences?liked=true`에만 있다.
 *
 * `/books`를 따로 받는 이유는 `GET /sentences`가 책을 붙여주지 않아서다.
 * 책등 색이 출처를 대신하는 디자인이라 책이 없으면 줄이 어디서 왔는지 사라진다.
 * 합치는 규칙 자체는 `lib/feed.ts`에 있다.
 */
export function useSentenceFeed() {
  const asks = useQuery({
    queryKey: ['asks', 'feed', FEED_LIMIT],
    queryFn: () => api<ApiAskView[]>(`/asks?limit=${FEED_LIMIT}`),
  });
  const liked = useQuery({
    queryKey: ['sentences', 'liked', 'all'],
    queryFn: () => api<ApiSentence[]>('/sentences?liked=true'),
  });
  const books = useBooks();
  const items = useItems();

  const feed = buildFeed({
    asks: asks.data ?? [],
    liked: liked.data ?? [],
    books: books.data ?? [],
    items: items.data ?? [],
  });
  const settled = !asks.isPending && !liked.isPending;

  return {
    /** 담아둔 문장이 없으면 개발 빌드에서만 가짜 열 줄. 배포에는 안 돈다. */
    feed: __DEV__ && settled && !feed.length ? sampleFeed() : feed,
    isPending: asks.isPending || liked.isPending,
    error: asks.error ?? liked.error ?? null,
  };
}
