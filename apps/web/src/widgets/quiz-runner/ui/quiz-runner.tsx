'use client';

import { useState } from 'react';
import { Check, Clock, X } from 'lucide-react';
import { bookById } from '@/entities/book/model/mock';
import { QUIZ, QUIZ_INDEX, QUIZ_TOTAL } from '@/entities/quiz/model/mock';
import { cn } from '@/shared/lib/cn';
import { ProgressBar } from '@/shared/ui/progress-bar';

const LETTERS = ['A', 'B', 'C', 'D'];

export function QuizRunner() {
  const question = QUIZ[0];
  const book = bookById(question.bookId);
  const [picked, setPicked] = useState<string | null>(null);

  const answered = picked !== null;
  const correct = picked === question.answer;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <ProgressBar value={QUIZ_INDEX / QUIZ_TOTAL} className="flex-1" />
        <span className="wds-caption-1 shrink-0 font-semibold text-(--text-meta)">
          {QUIZ_INDEX} / {QUIZ_TOTAL}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <section className="flex flex-col gap-3">
          <div className="wds-caption-1 flex items-center gap-1.5 text-(--text-meta)">
            <Clock size={13} />
            {question.askedLabel}
          </div>
          <div className="rounded-[28px] bg-(--surface-ink) px-8 py-9">
            <blockquote className="quote text-[24px] leading-[1.55] text-white">
              {question.before}{' '}
              <span
                className={cn(
                  'inline-block min-w-[120px] border-b-2 text-center align-[-3px]',
                  answered
                    ? 'border-(--color-primary) font-semibold text-(--color-primary)'
                    : 'h-[1.1em] border-(--color-primary)',
                )}
              >
                {answered ? question.answer : ''}
              </span>{' '}
              {question.after}
            </blockquote>
            <p className="wds-caption-1 mt-5 text-(--text-on-ink-faint)">
              {book?.title} · p.{question.page}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="wds-label-2 font-semibold text-(--text-secondary)">
            헷갈렸던 표현 중에서 골라보세요
          </h2>
          {question.choices.map((choice, i) => {
            const isAnswer = choice === question.answer;
            const isPicked = choice === picked;
            const state = !answered
              ? 'idle'
              : isAnswer
                ? 'correct'
                : isPicked
                  ? 'wrong'
                  : 'dim';

            return (
              <button
                key={choice}
                type="button"
                disabled={answered}
                onClick={() => setPicked(choice)}
                className={cn(
                  'flex h-14 items-center gap-3 rounded-2xl px-5 text-left transition-all',
                  state === 'idle' &&
                    'bg-(--surface-card) inset-ring inset-ring-(--border-strong) hover:bg-(--surface-alt)',
                  state === 'correct' &&
                    'bg-(--color-primary-bg) inset-ring-2 inset-ring-(--color-primary)',
                  state === 'wrong' &&
                    'bg-[rgba(255,66,66,0.05)] inset-ring-2 inset-ring-(--status-negative)',
                  state === 'dim' &&
                    'bg-(--surface-card) opacity-45 inset-ring inset-ring-(--border-default)',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    state === 'correct' && 'bg-(--color-primary) text-white',
                    state === 'wrong' && 'bg-(--status-negative) text-white',
                    (state === 'idle' || state === 'dim') &&
                      'bg-(--fill-default) text-(--text-meta)',
                  )}
                >
                  {state === 'correct' ? (
                    <Check size={13} strokeWidth={2.6} />
                  ) : state === 'wrong' ? (
                    <X size={13} strokeWidth={2.6} />
                  ) : (
                    LETTERS[i]
                  )}
                </span>
                <span
                  className={cn(
                    'quote text-[17px]',
                    state === 'correct'
                      ? 'font-semibold text-(--color-primary)'
                      : 'text-(--text-primary)',
                  )}
                >
                  {choice}
                </span>
              </button>
            );
          })}
        </section>
      </div>

      {answered ? (
        <section className="flex flex-col gap-4">
          <h2 className="wds-heading-2 text-(--text-primary)">
            {correct
              ? '맞았어요. 이 둘은 이렇게 달라요'
              : '아쉬워요. 이 둘은 이렇게 달라요'}
          </h2>
          <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] overflow-hidden rounded-2xl inset-ring inset-ring-(--border-default)">
            <div className="p-6">
              <div className="quote text-[20px] font-semibold text-(--text-primary)">
                {question.contrast.left}
              </div>
              <p className="wds-label-2 mt-1.5 text-(--text-meta)">
                어깨를 으쓱하는 무관심
              </p>
            </div>
            <div className="bg-(--border-default)" aria-hidden />
            <div className="bg-(--color-primary-bg) p-6">
              <div className="quote text-[20px] font-semibold text-(--color-primary)">
                {question.contrast.right}
              </div>
              <p className="wds-label-2 mt-1.5 text-(--text-secondary)">
                손으로 털어내듯 흘려보내기
              </p>
            </div>
          </div>
          <p className="wds-body-2-reading rounded-2xl bg-(--surface-alt) px-6 py-5 text-(--text-secondary)">
            {question.contrast.note}
          </p>
        </section>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!answered}
          className="h-13 rounded-xl bg-(--surface-ink) px-8 py-4 text-[15px] font-semibold text-white transition-opacity disabled:opacity-30"
        >
          다음 문장
        </button>
      </div>
    </div>
  );
}
