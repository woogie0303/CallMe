import { Search } from 'lucide-react';
import { NextBooks } from '@/widgets/next-books/ui/next-books';
import { ReadingHero } from '@/widgets/reading-hero/ui/reading-hero';
import { ReadingYear } from '@/widgets/reading-year/ui/reading-year';
import { SentenceShelf } from '@/widgets/sentence-shelf/ui/sentence-shelf';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-10 px-8 py-10 xl:px-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="wds-title-1 text-(--text-primary)">
            132페이지에서 멈췄어요
          </h1>
          <p className="wds-body-2 mt-2 text-(--text-secondary)">
            어제 여기까지 읽고, 표현 세 개를 담아뒀어요.
          </p>
        </div>
        <div className="relative w-full max-w-[280px]">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--text-assistive)"
          />
          <input
            type="search"
            placeholder="책이나 표현 찾기"
            aria-label="책이나 표현 찾기"
            className="wds-label-1 h-11 w-full rounded-xl bg-(--surface-alt) pr-4 pl-10 text-(--text-primary) placeholder:text-(--text-assistive) focus:outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-(--color-primary)"
          />
        </div>
      </header>

      <ReadingHero />
      <ReadingYear />
      <SentenceShelf />
      <NextBooks />
    </div>
  );
}
