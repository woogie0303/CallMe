import type { ReactNode } from 'react';

type Props = {
  title: string;
  /** 제목 오른쪽 — 개수나 링크 같은 보조 정보 */
  aside?: ReactNode;
};

export function SectionHeader({ title, aside }: Props) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="wds-heading-2 text-(--text-primary)">{title}</h2>
      {aside ? (
        <div className="wds-caption-1 text-(--text-meta)">{aside}</div>
      ) : null}
    </div>
  );
}
