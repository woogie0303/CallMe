import Link from 'next/link';
import { Camera, ChevronRight, Mic, Send } from 'lucide-react';
import { bookById } from '@/entities/book/model/mock';
import { BookCover } from '@/entities/book/ui/book-cover';
import { CURRENT_READING } from '@/entities/reading/model/mock';
import { ProgressBar } from '@/shared/ui/progress-bar';

const NEXT_UP = [
  {
    href: '/retell',
    title: '리텔링 시작하기',
    detail: 'Chapter 12를 말로 옮겨보세요',
  },
  {
    href: '/quiz',
    title: '퀴즈 5문항',
    detail: '2월에 물어본 문장이 섞여 있어요',
  },
  {
    href: '/drawer',
    title: '표현 3개 정리하기',
    detail: '어제 담아둔 표현이 그대로 있어요',
  },
];

export function ReadingHero() {
  const book = bookById(CURRENT_READING.bookId);
  if (!book) return null;

  const ratio = CURRENT_READING.currentPage / CURRENT_READING.totalPages;

  return (
    <section className="grid gap-8 rounded-[28px] bg-(--surface-ink) p-7 lg:grid-cols-[132px_minmax(0,1fr)_1px_248px]">
      <BookCover book={book} size="lg" className="hidden lg:flex" />

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-start gap-5">
          <BookCover book={book} size="md" className="lg:hidden" />
          <div className="min-w-0">
            <div className="wds-caption-2 font-semibold text-(--text-on-ink-muted)">
              읽고 있는 책
            </div>
            <h2 className="quote mt-2 text-[28px] leading-[1.2] font-semibold text-(--text-on-ink)">
              {book.title}
            </h2>
            <p className="wds-label-2 mt-1.5 text-(--text-on-ink-muted)">
              {book.author} · {CURRENT_READING.chapter}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <ProgressBar value={ratio} onInk />
          <p className="wds-caption-1 text-(--text-on-ink-muted)">
            p.{CURRENT_READING.currentPage} / {CURRENT_READING.totalPages} ·{' '}
            {Math.round(ratio * 100)}% · {CURRENT_READING.lastReadLabel}
          </p>
        </div>

        <form className="rounded-2xl bg-(--fill-on-ink) p-3">
          <label htmlFor="memo" className="sr-only">
            이 책에 대한 메모
          </label>
          <textarea
            id="memo"
            rows={2}
            placeholder="읽다가 걸린 표현이나 장면을 적어두세요"
            className="wds-body-2-reading w-full resize-none bg-transparent px-2 py-1 text-(--text-on-ink) placeholder:text-(--text-on-ink-faint) focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.06)] text-white/70 transition-colors hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
              aria-label="페이지 촬영"
            >
              <Camera size={17} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.06)] text-white/70 transition-colors hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
              aria-label="음성으로 메모"
            >
              <Mic size={17} strokeWidth={1.8} />
            </button>
            <span className="wds-caption-2 ml-1 text-(--text-on-ink-faint)">
              p.{CURRENT_READING.currentPage}에 저장돼요
            </span>
            <button
              type="submit"
              className="ml-auto flex h-9 items-center gap-1.5 rounded-xl bg-(--color-primary) px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-strong)"
            >
              <Send size={14} strokeWidth={2} />
              메모 저장
            </button>
          </div>
        </form>
      </div>

      <div className="hidden bg-(--border-on-ink) lg:block" aria-hidden />

      <div className="flex flex-col gap-1">
        <div className="wds-caption-2 mb-2 font-semibold text-(--text-on-ink-muted)">
          이어서 할 일
        </div>
        {NEXT_UP.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <div className="min-w-0 flex-1">
              <div className="wds-label-2 font-semibold text-(--text-on-ink)">
                {item.title}
              </div>
              <div className="wds-caption-2 mt-0.5 truncate text-(--text-on-ink-faint)">
                {item.detail}
              </div>
            </div>
            <ChevronRight
              size={15}
              className="shrink-0 text-white/25 transition-colors group-hover:text-white/60"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
