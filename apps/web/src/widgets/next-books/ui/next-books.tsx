import { BOOKS } from '@/entities/book/model/mock';
import { BookCover } from '@/entities/book/ui/book-cover';
import { SectionHeader } from '@/shared/ui/section-header';

const REASONS: Record<string, string> = {
  'normal-people': '대화가 많아 회화에 좋아요',
  remains: '같은 작가 · 1인칭 회고',
  piranesi: '문장이 짧고 반복돼요',
  'small-things': '116쪽 · 사흘이면 읽어요',
};

export function NextBooks() {
  const books = BOOKS.filter((b) => b.id !== 'klara');

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="다음에 읽어볼 만한 책"
        aside="담아둔 표현을 기준으로"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {books.map((book) => (
          <article
            key={book.id}
            className="group flex gap-4 rounded-2xl p-3 transition-colors hover:bg-(--surface-alt)"
          >
            <BookCover book={book} size="md" />
            <div className="flex min-w-0 flex-col gap-1 pt-1">
              <h3 className="wds-label-1 truncate font-semibold text-(--text-primary)">
                {book.title}
              </h3>
              <p className="wds-caption-1 text-(--text-meta)">{book.author}</p>
              <p className="wds-caption-1 mt-auto text-(--text-secondary)">
                {REASONS[book.id]}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
