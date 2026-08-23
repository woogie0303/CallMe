import Link from 'next/link';
import { ArrowRight, Mic, Sparkles } from 'lucide-react';
import { bookById } from '@/entities/book/model/mock';
import { expressionById } from '@/entities/expression/model/mock';
import { RETELL_SESSION } from '@/entities/retell/model/mock';

export function RetellReview() {
  const session = RETELL_SESSION;
  const book = bookById(session.bookId);

  return (
    <div className="flex flex-col gap-9">
      <section className="grid gap-7 rounded-[28px] bg-(--surface-ink) p-7 lg:grid-cols-[minmax(0,1fr)_1px_160px] lg:items-center">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="wds-caption-2 font-semibold text-(--text-on-ink-muted)">
            {book?.title} · {session.chapter}
          </div>

          <div className="flex h-16 items-center gap-[2px]" aria-hidden>
            {session.waveform.map((height, i) => (
              <span
                key={i}
                className="min-w-[2px] flex-1 rounded-full"
                style={{
                  height: `${height}%`,
                  background:
                    height > 45
                      ? 'var(--color-primary)'
                      : `rgba(255,255,255,${0.15 + (height / 100) * 0.25})`,
                }}
              />
            ))}
          </div>

          <blockquote className="quote text-[19px] leading-[1.55] text-white/90">
            {session.transcript}
          </blockquote>

          <div className="flex items-center gap-4">
            <span className="wds-caption-1 text-(--text-on-ink-faint)">
              {session.durationLabel} · 녹음 완료
            </span>
            <button
              type="button"
              className="wds-caption-1 font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              다시 말하기
            </button>
          </div>
        </div>

        <div className="hidden self-stretch bg-(--border-on-ink) lg:block" aria-hidden />

        <div className="flex flex-col items-start gap-3 lg:items-center">
          <button
            type="button"
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-(--color-primary) text-white shadow-(--shadow-primary) transition-colors hover:bg-(--color-primary-strong)"
            aria-label="이어서 녹음하기"
          >
            <Mic size={28} strokeWidth={1.8} />
          </button>
          <span className="wds-caption-2 text-(--text-on-ink-faint)">
            이어서 녹음하기
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="wds-heading-2 flex items-center gap-2 text-(--text-primary)">
          <Sparkles size={18} className="text-(--color-primary)" />
          이렇게 말하면 더 자연스러워요
        </h2>

        {session.revisions.map((revision) => (
          <article
            key={revision.id}
            className="overflow-hidden rounded-2xl bg-(--surface-card) shadow-(--shadow-sm) inset-ring inset-ring-(--border-default)"
          >
            <div className="grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <div className="flex flex-col gap-2 p-6">
                <div className="wds-caption-2 font-semibold text-(--text-meta)">
                  내가 말한 문장
                </div>
                <p className="quote text-[16px] leading-[1.55] text-(--text-meta) line-through decoration-(--border-strong)">
                  {revision.mine}
                </p>
              </div>

              <div
                className="flex items-center justify-center px-2 md:border-x md:border-(--border-default)"
                aria-hidden
              >
                <ArrowRight
                  size={18}
                  className="my-2 rotate-90 text-(--color-primary) md:rotate-0"
                />
              </div>

              <div className="flex flex-col gap-2 bg-(--color-primary-bg) p-6">
                <div className="wds-caption-2 font-semibold text-(--color-primary)">
                  이렇게
                </div>
                <p className="quote text-[17px] leading-[1.55] font-semibold text-(--text-primary)">
                  {revision.better}
                </p>
              </div>
            </div>

            <p className="wds-body-2-reading border-t border-(--border-default) px-6 py-5 text-(--text-secondary)">
              {revision.note}
            </p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-(--surface-alt) p-6">
        <h2 className="wds-label-1 font-semibold text-(--text-secondary)">
          이 챕터에서 쓸 수 있었던 표현
        </h2>
        <div className="flex flex-wrap gap-2">
          {session.missedExpressionIds.map((id) => {
            const expression = expressionById(id);
            if (!expression) return null;
            return (
              <Link
                key={id}
                href="/drawer"
                className="quote rounded-xl bg-(--surface-card) px-3.5 py-2 text-[15px] text-(--text-primary) inset-ring inset-ring-(--border-default) transition-colors hover:inset-ring-(--color-primary-line)"
              >
                {expression.term}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
