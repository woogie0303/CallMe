import { cn } from '@/shared/lib/cn';
import type { Book } from '../model/types';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, string> = {
  sm: 'w-[34px] h-[46px] rounded-md',
  md: 'w-[88px] h-[120px] rounded-[10px] p-2.5',
  lg: 'w-[132px] h-[186px] rounded-xl p-3.5',
};

/**
 * 표지 이미지는 없다. 책등 색과 세리프로 조판한 제목이 표지 역할을 한다 —
 * 앱 전체에서 같은 색이 같은 책을 뜻한다.
 */
export function BookCover({
  book,
  size = 'md',
  className,
}: {
  book: Book;
  size?: Size;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col justify-end overflow-hidden',
        SIZES[size],
        size === 'lg' && 'shadow-(--shadow-cover)',
        className,
      )}
      style={{ background: book.spine }}
      aria-hidden
    >
      {size !== 'sm' ? (
        <span
          className={cn(
            'quote leading-[1.18] text-white/92',
            size === 'lg' ? 'text-[15px]' : 'text-[11px]',
          )}
        >
          {book.title}
        </span>
      ) : null}
      {size === 'lg' ? (
        <span className="mt-1.5 text-[9px] tracking-[0.06em] text-white/70 uppercase">
          {book.author}
        </span>
      ) : null}
    </div>
  );
}

/** 카드 왼쪽에 세우는 책등 — 라벨 없이 출처를 알려준다. */
export function SpineEdge({ book }: { book: Book }) {
  return (
    <span
      aria-hidden
      className="absolute inset-y-0 left-0 w-1 rounded-l-[inherit]"
      style={{ background: book.spine }}
    />
  );
}
