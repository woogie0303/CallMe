import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useBooks } from '@/entities/book/api/book.api';
import { useItems } from '@/entities/lexical-item/api/item.api';
import { api } from '@/shared/api/client';
import type { ApiAskView, ApiSentence } from '@/shared/api/types';
import { sampleFeed } from '@/entities/lexical-item/lib/sample';
import { buildFeed } from '../lib/feed';

/** 한 번에 더 받아오는 줄 수 */
const PAGE = 50;
/** 서버가 한 번에 내주는 상한. 이보다 더 보려면 진짜 커서가 있어야 한다. */
const MAX = 200;

/**
 * 서랍에 쌓이는 문장들(ADR-0004).
 *
 * 원천이 둘인데 서로 겹치지 않는다. 서버가 `liked`를 "어휘 항목도 질문도
 * 붙지 않은 문장"으로 정의하기 때문이다 — 물어본 문장은 `/asks`에만, 그냥
 * 담아둔 문장은 `/sentences?liked=true`에만 있다.
 *
 * `/books`를 따로 받는 이유는 `GET /sentences`가 책을 붙여주지 않아서다.
 * 표지(없으면 책등 색)가 출처를 대신하는 디자인이라 책이 없으면 줄이 어디서 왔는지 사라진다.
 * 합치는 규칙 자체는 `lib/feed.ts`에 있다.
 */
export function useSentenceFeed() {
  /**
   * 두 원천을 같은 수만큼 받아 합친다. 각 원천이 최신순이므로, 합친 것의 앞쪽은
   * 빠진 것 없이 최신이다 — 두 줄기를 커서로 정확히 엮지 않아도 목록 앞은 맞는다.
   */
  const [limit, setLimit] = useState(PAGE);

  const asks = useQuery({
    queryKey: ['asks', 'feed', limit],
    queryFn: () => api<ApiAskView[]>(`/asks?limit=${limit}`),
  });
  const liked = useQuery({
    queryKey: ['sentences', 'liked', 'all', limit],
    queryFn: () => api<ApiSentence[]>(`/sentences?liked=true&limit=${limit}`),
  });
  const books = useBooks();
  const items = useItems();

  const all = buildFeed({
    asks: asks.data ?? [],
    liked: liked.data ?? [],
    books: books.data ?? [],
    items: items.data ?? [],
  });
  /**
   * 답을 기다리는 문장은 서랍 목록에 세우지 않는다. 서랍 위의 "문장 N개가 답을
   * 기다리고 있어요"를 누르면 모두 모여 있다 — 목록에도 섞어 두면 같은 문장이 두
   * 군데에 서고, 아직 뜻도 표현도 없는 줄이 서랍을 채운다. 답이 오면 목록으로 온다.
   */
  const waiting = all.filter((row) => row.pending);
  /**
   * 물어서 답은 왔는데 표현을 하나도 안 고른 문장. 이것도 목록에 세우지 않는다 —
   * 좋아서 담은 문장이 아니고, 담은 표현도 아직 없다. 서랍 위 한 줄이 모으고,
   * 거기서 하나씩 들어가 표현을 고르거나 지운다. 하나라도 담으면 '담은 표현'으로 간다.
   */
  const unpicked = all.filter(
    (row) => row.asked && !row.pending && !row.claimed && !row.favorite,
  );
  const feed = all.filter((row) => !row.pending && !unpicked.includes(row));
  const settled = !asks.isPending && !liked.isPending;

  /** 어느 한쪽이라도 상한만큼 받아왔으면 더 있을 수 있다 */
  const brimming =
    (asks.data?.length ?? 0) >= limit || (liked.data?.length ?? 0) >= limit;

  return {
    /** 담아둔 문장이 없으면 개발 빌드에서만 가짜 열 줄. 배포에는 안 돈다. */
    feed: __DEV__ && settled && !all.length ? sampleFeed() : feed,
    /** 답을 기다리는 문장 — 목록 대신 서랍 위 한 줄이 알린다 */
    waiting,
    /** 답은 왔는데 표현을 안 고른 문장 — 이것도 서랍 위 한 줄이 알린다 */
    unpicked,
    isPending: asks.isPending || liked.isPending,
    error: asks.error ?? liked.error ?? null,
    hasMore: settled && brimming && limit < MAX,
    loadingMore: limit > PAGE && (asks.isFetching || liked.isFetching),
    loadMore: () => setLimit((n) => Math.min(MAX, n + PAGE)),
  };
}
