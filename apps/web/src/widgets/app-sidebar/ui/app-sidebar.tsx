'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Library, Mic, Rows3 } from 'lucide-react';
import { bookById } from '@/entities/book/model/mock';
import { BookCover } from '@/entities/book/ui/book-cover';
import { CURRENT_READING } from '@/entities/reading/model/mock';
import { cn } from '@/shared/lib/cn';
import { ProgressBar } from '@/shared/ui/progress-bar';

const NAV = [
  { href: '/', label: '서재', icon: Library },
  { href: '/drawer', label: '문장 서랍', icon: Rows3 },
  { href: '/retell', label: '리텔링', icon: Mic },
  { href: '/quiz', label: '퀴즈', icon: GraduationCap },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const book = bookById(CURRENT_READING.bookId);
  const ratio = CURRENT_READING.currentPage / CURRENT_READING.totalPages;

  return (
    <aside className="sticky top-0 flex h-screen w-[244px] shrink-0 flex-col border-r border-(--border-subtle) bg-(--surface-base) px-5 py-7">
      <Link
        href="/"
        className="mb-8 px-2 text-[26px] font-bold tracking-[-0.03em] text-(--text-primary)"
      >
        Reread
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                active
                  ? 'bg-(--fill-default) text-(--text-primary)'
                  : 'text-(--text-meta) hover:bg-(--fill-subtle) hover:text-(--text-secondary)',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
              <span className={cn('wds-label-1', active && 'font-semibold')}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        {book ? (
          <Link
            href="/"
            className="block rounded-2xl bg-(--surface-alt) p-4 transition-colors hover:bg-(--fill-default)"
          >
            <div className="wds-caption-2 mb-3 font-semibold text-(--text-meta)">
              지금 읽는 책
            </div>
            <div className="flex items-start gap-3">
              <BookCover book={book} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="wds-label-2 truncate font-semibold text-(--text-primary)">
                  {book.title}
                </div>
                <div className="wds-caption-2 mt-0.5 text-(--text-meta)">
                  p.{CURRENT_READING.currentPage} / {CURRENT_READING.totalPages}
                </div>
              </div>
            </div>
            <ProgressBar value={ratio} className="mt-3" />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
