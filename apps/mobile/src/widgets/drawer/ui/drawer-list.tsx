import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSentenceFeed } from '@/entities/sentence/api/feed.api';
import type { SentenceCardData } from '@/entities/sentence/model/types';
import { SentenceCard } from '@/entities/sentence/ui/sentence-card';
import { color } from '@/shared/config';
import { EmptyState } from '@/shared/ui';
import { DrawerFilterRow, type DrawerFilter } from './drawer-filter';

const MATCH: Record<DrawerFilter, (row: SentenceCardData) => boolean> = {
  '아직 안 물어봤어요': (s) => !s.asked,
  '표현이 있어요': (s) => s.marks.length > 0,
  '다시 만났어요': (s) => s.marks.some((m) => (m.met ?? 0) > 1),
};

/**
 * 서랍 — 담아둔 문장이 시간순으로 쌓인다(ADR-0004).
 *
 * 항목이 아니라 문장이 한 줄씩 선다. 표현은 문장 안의 밑줄이고, 밑줄을 누르면
 * 그 표현이 만난 모든 문장으로 간다 — 재회가 보이는 자리는 거기다.
 *
 * 거르는 일은 앞에서 한다. 갈래가 전부 같은 목록을 다르게 보는 것뿐이라,
 * 갈래를 바꿀 때마다 서버에 다시 물어보면 이미 손에 있는 걸 또 받는 셈이다.
 */
export function DrawerList({
  query,
  onOpenItem,
  onAsk,
}: {
  /** 검색어 — 문장이나 번역에 들어 있으면 남긴다. 갈래와 함께 걸린다. */
  query?: string;
  onOpenItem?: (itemId: string) => void;
  onAsk?: (sentenceId: string) => void;
}) {
  const [filter, setFilter] = useState<DrawerFilter | undefined>();
  const { feed, isPending, error } = useSentenceFeed();

  const byFilter = filter ? feed.filter(MATCH[filter]) : feed;
  const needle = query?.trim().toLowerCase();
  /** 번역까지 뒤지는 이유 — 영어가 기억 안 날 때 한국어로 찾는 길은 있어야 한다 */
  const rows = needle
    ? byFilter.filter(
        (s) =>
          s.text.toLowerCase().includes(needle) ||
          s.translation?.toLowerCase().includes(needle) ||
          s.marks.some((m) => m.term.toLowerCase().includes(needle)),
      )
    : byFilter;

  return (
    <View style={styles.wrap}>
      <DrawerFilterRow value={filter} onChange={setFilter} />

      {isPending ? (
        <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
      ) : error ? (
        <EmptyState mark="quiet" title="목록을 불러오지 못했어요" body={error.message} />
      ) : rows.length ? (
        <View style={styles.list}>
          {rows.map((row) => (
            <SentenceCard key={row.id} data={row} onOpenItem={onOpenItem} onAsk={onAsk} />
          ))}
        </View>
      ) : (
        <EmptyState
          mark={needle ? 'quiet' : 'sentence'}
          title={
            needle
              ? `'${query}'와 맞는 문장이 없어요`
              : filter === '다시 만났어요'
                ? '아직 같은 표현을 두 번 만난 적이 없어요'
                : filter === '아직 안 물어봤어요'
                  ? '물어볼 문장이 남아 있지 않아요'
                  : filter
                    ? '아직 이 갈래에 담아둔 문장이 없어요'
                    : '아직 담아둔 문장이 없어요'
          }
          body={needle || filter ? undefined : '읽다 막힌 쪽을 찍어서 문장을 담아보세요.'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  list: { gap: 10 },
  spinner: { paddingTop: 40 },
});
