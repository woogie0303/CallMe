import Link from 'next/link';
import { bookById } from '@/entities/book/model/mock';
import { SpineEdge } from '@/entities/book/ui/book-cover';
import { SENTENCES } from '@/entities/sentence/model/mock';
import { SectionHeader } from '@/shared/ui/section-header';

export function SentenceShelf() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="다시 볼 문장"
        aside={
          <Link href="/drawer" className="hover:text-(--color-primary)">
            전체 128개
          </Link>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {SENTENCES.map((sentence) => {
          const book = bookById(sentence.bookId);
          if (!book) return null;
          return (
            <article
              key={sentence.id}
              className="relative flex flex-col gap-3 rounded-2xl bg-(--surface-card) py-5 pr-5 pl-6 shadow-(--shadow-sm) inset-ring inset-ring-(--border-default) transition-shadow hover:shadow-(--shadow-md)"
            >
              <SpineEdge book={book} />
              <blockquote className="quote text-[17px] leading-[1.5] text-(--text-primary)">
                {sentence.text}
              </blockquote>
              {sentence.note ? (
                <p className="wds-label-2 text-(--text-secondary)">
                  {sentence.note}
                </p>
              ) : null}
              <footer className="wds-caption-1 mt-auto text-(--text-meta)">
                {book.title} · p.{sentence.page} · {sentence.savedLabel}
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
