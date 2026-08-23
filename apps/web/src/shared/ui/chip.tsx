import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Tone = 'neutral' | 'primary' | 'positive' | 'onInk';

const TONES: Record<Tone, string> = {
  neutral: 'bg-(--fill-default) text-(--text-secondary)',
  primary: 'bg-(--color-primary-bg) text-(--color-primary)',
  positive: 'bg-[rgba(0,191,64,0.1)] text-(--status-positive-text)',
  onInk: 'bg-(--fill-on-ink) text-(--text-on-ink-muted)',
};

export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
