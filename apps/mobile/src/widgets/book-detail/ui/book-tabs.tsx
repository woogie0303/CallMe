import { SectionSwitch, type SectionOption } from '@/shared/ui';

export type BookTab = 'items' | 'liked';

const TABS: SectionOption<BookTab>[] = [
  { value: 'items', icon: 'tag', title: '이 책에서 담은 표현' },
  { value: 'liked', icon: 'heart', title: '마음에 들었던 문장' },
];

/**
 * 책 화면의 갈래.
 *
 * 담은 표현과 마음에 든 문장은 둘 다 "내가 이 책에서 남긴 것"이라 나란히
 * 탭으로 선다. 한동안 '담은 표현'만 상설 자리를 갖고 있었는데 위계에 근거가
 * 없었고, 비어 있을 때는 빈 상태 문구가 화면에서 제일 좋은 자리를 차지했다.
 * 그 자리는 이제 '읽기 전에'(`widgets/book-primer`)가 쓴다. (리텔링 탭은
 * 걷어냈다 — 내 생각은 문장마다 스레드로 단다.)
 */
export function BookTabs({
  value,
  onChange,
  counts,
}: {
  value: BookTab;
  onChange: (next: BookTab) => void;
  /** 갈래별로 담긴 수 — 0이면 적지 않는다 */
  counts?: Partial<Record<BookTab, number>>;
}) {
  return (
    <SectionSwitch options={TABS} value={value} onChange={onChange} count={counts?.[value]} />
  );
}
