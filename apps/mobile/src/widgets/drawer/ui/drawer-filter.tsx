import type { SentenceCardData } from '@/entities/sentence/model/types';
import { SectionSwitch, type SectionOption } from '@/shared/ui';

/**
 * 서랍의 갈래(ADR-0004).
 *
 * 예전 갈래는 항목의 상태(외웠어요·헷갈려요)였다. 서랍이 문장의 목록이 된
 * 지금 그건 줄이 아니라 줄 **안의** 밑줄에 대한 이야기라, 여기서 물으면
 * 답할 수 없다 — 밑줄 셋이 서로 다른 상태인 문장은 어느 갈래인가.
 * 그래서 갈래도 문장이 답할 수 있는 것으로 바꾼다.
 *
 * - 마음에 들었던 문장 — 묻지 않고 담기만 한 문장과, 하트를 켠 문장.
 *   뜻을 몰라서가 아니라 좋아서 남긴 문장이다. 책 화면의 같은 갈래는 서버의
 *   `liked=true`가 가르는데, 그 규칙과 **똑같아야 한다** — 한때 여기만 '밑줄이
 *   없으면'으로 갈라서, 물어놓고 표현을 안 고른 문장이 서랍에선 마음에 든
 *   문장인데 책에선 아무 데도 없었다.
 * - 담은 표현 — 표현을 하나라도 담은 문장.
 * - 다시 만난 표현 — 그 밑줄 가운데 두 번 넘게 만난 것이 있는 문장.
 *
 * 물어서 답은 왔는데 표현을 아직 안 고른 문장은 어느 갈래에도 없다 — 할 일이라
 * 서랍 위 한 줄('표현을 고를 문장')이 따로 모은다(`useSentenceFeed`의 `unpicked`).
 *
 * 하트를 켠 표현 문장은 첫째와 둘째에 함께 서고, 셋째는 둘째 안에 든다.
 * '전체'는 두지 않는다 — 카드가 상태 라벨을 달지 않는 대신 갈래 이름이 지금
 * 무엇을 보는지 말한다.
 */
export type DrawerFilter = 'liked' | 'items' | 'again';

export const DRAWER_FILTERS: SectionOption<DrawerFilter>[] = [
  { value: 'liked', icon: 'heart', title: '마음에 들었던 문장' },
  { value: 'items', icon: 'tag', title: '담은 표현' },
  { value: 'again', icon: 'clock', title: '다시 만난 표현' },
];

export const DRAWER_MATCH: Record<
  DrawerFilter,
  (row: SentenceCardData) => boolean
> = {
  liked: (s) => (!s.asked && !s.claimed) || Boolean(s.favorite),
  items: (s) => s.claimed,
  again: (s) => s.marks.some((m) => (m.met ?? 0) > 1),
};

export function DrawerFilterRow({
  value,
  onChange,
  count,
}: {
  value: DrawerFilter;
  onChange: (next: DrawerFilter) => void;
  count?: number;
}) {
  return (
    <SectionSwitch
      options={DRAWER_FILTERS}
      value={value}
      onChange={onChange}
      count={count}
    />
  );
}
