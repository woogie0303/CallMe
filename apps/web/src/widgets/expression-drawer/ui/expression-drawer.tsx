'use client';

import { useMemo, useState } from 'react';
import { Check, GraduationCap } from 'lucide-react';
import { bookById } from '@/entities/book/model/mock';
import { SpineEdge } from '@/entities/book/ui/book-cover';
import { EXPRESSIONS, expressionById } from '@/entities/expression/model/mock';
import type { Expression } from '@/entities/expression/model/types';
import { cn } from '@/shared/lib/cn';
import { on } from '@/shared/lib/label';
import { ExpressionContrast } from './expression-contrast';

const FILTERS = ['전체', '헷갈려요', '외웠어요'] as const;
type Filter = (typeof FILTERS)[number];

export function ExpressionDrawer() {
  const [filter, setFilter] = useState<Filter>('전체');
  const [selectedId, setSelectedId] = useState(EXPRESSIONS[0].id);

  const list = useMemo(
    () =>
      filter === '전체'
        ? EXPRESSIONS
        : EXPRESSIONS.filter((e) => e.status === filter),
    [filter],
  );

  const selected =
    list.find((e) => e.id === selectedId) ?? list[0] ?? EXPRESSIONS[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'wds-label-2 rounded-full px-3.5 py-1.5 transition-colors',
                filter === f
                  ? 'bg-(--surface-ink) font-semibold text-white'
                  : 'bg-(--fill-default) text-(--text-secondary) hover:bg-(--fill-bold)',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <ul className="flex flex-col gap-2">
          {list.map((expression) => {
            const book = bookById(expression.bookId);
            const active = expression.id === selected.id;
            if (!book) return null;
            return (
              <li key={expression.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(expression.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'relative w-full rounded-2xl py-4 pr-4 pl-6 text-left transition-colors',
                    active
                      ? 'bg-(--color-primary-bg) inset-ring inset-ring-(--color-primary-line)'
                      : 'bg-(--surface-card) inset-ring inset-ring-(--border-default) hover:bg-(--surface-alt)',
                  )}
                >
                  <SpineEdge book={book} />
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={cn(
                        'quote text-[16px] font-semibold',
                        active
                          ? 'text-(--color-primary)'
                          : 'text-(--text-primary)',
                      )}
                    >
                      {expression.term}
                    </span>
                    {expression.status === '외웠어요' ? (
                      <Check
                        size={14}
                        className="shrink-0 text-(--status-positive)"
                      />
                    ) : null}
                  </div>
                  <p className="wds-label-2 mt-1 truncate text-(--text-secondary)">
                    {expression.meaning}
                  </p>
                  <p className="wds-caption-1 mt-1.5 text-(--text-meta)">
                    {book.title} · p.{expression.page} · {expression.askedLabel}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <ExpressionDetail expression={selected} />
    </div>
  );
}

function ExpressionDetail({ expression }: { expression: Expression }) {
  const book = bookById(expression.bookId);
  const related = expression.confusedWith
    ? expressionById(expression.confusedWith.expressionId)
    : undefined;

  return (
    <article className="flex flex-col gap-7 self-start lg:sticky lg:top-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="wds-caption-1 text-(--text-meta)">
            {on(expression.askedLabel)} 처음 물어봤어요
          </span>
        </div>
        <h2 className="quote text-[38px] leading-[1.15] font-semibold text-(--text-primary)">
          {expression.term}
        </h2>
        <p className="wds-body-1-reading text-(--text-neutral)">
          {expression.meaning}
        </p>
      </header>

      <section className="flex flex-col gap-2.5">
        <h3 className="wds-label-2 font-semibold text-(--text-secondary)">
          이 책에서는 이렇게 쓰였어요
        </h3>
        <blockquote className="quote rounded-2xl bg-(--surface-alt) px-5 py-4 text-[17px] leading-[1.55] text-(--text-neutral)">
          {expression.example}
        </blockquote>
        <p className="wds-caption-1 text-(--text-meta)">
          {book?.title} · {book?.author} · p.{expression.page}
        </p>
      </section>

      {related && expression.confusedWith ? (
        <ExpressionContrast
          now={expression}
          then={related}
          note={expression.confusedWith.note}
        />
      ) : null}

      <div className="flex gap-2.5">
        <button
          type="button"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-(--color-primary) text-[15px] font-semibold text-white shadow-(--shadow-primary) transition-colors hover:bg-(--color-primary-strong)"
        >
          <GraduationCap size={17} strokeWidth={1.9} />
          퀴즈에 넣기
        </button>
        <button
          type="button"
          className="h-12 rounded-xl bg-(--fill-default) px-6 text-[15px] font-semibold text-(--text-neutral) transition-colors hover:bg-(--fill-bold)"
        >
          외웠어요
        </button>
      </div>
    </article>
  );
}
