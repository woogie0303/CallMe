import { bookById } from '@/entities/book/model/mock';
import type { Expression } from '@/entities/expression/model/types';
import { on } from '@/shared/lib/label';

/**
 * Reread의 웹 전용 장치 — 대조.
 * 모바일에서는 위아래로 쌓을 수밖에 없던 두 표현을, 폭이 있는 화면에서는
 * 가운데 헤어라인을 두고 나란히 놓는다. 지금 보는 쪽만 파랗다.
 */
export function ExpressionContrast({
  now,
  then,
  note,
}: {
  now: Expression;
  then: Expression;
  note: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="wds-label-2 font-semibold text-(--text-secondary)">
        예전에 물어본 표현과 나란히 놓아봤어요
      </h3>

      <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] overflow-hidden rounded-2xl inset-ring inset-ring-(--border-default)">
        <ContrastSide expression={now} highlighted />
        <div className="bg-(--border-default)" aria-hidden />
        <ContrastSide expression={then} />
      </div>

      <p className="wds-body-2-reading rounded-2xl bg-(--surface-alt) px-5 py-4 text-(--text-secondary)">
        {note}
      </p>
    </section>
  );
}

function ContrastSide({
  expression,
  highlighted = false,
}: {
  expression: Expression;
  highlighted?: boolean;
}) {
  const book = bookById(expression.bookId);
  return (
    <div
      className={
        highlighted
          ? 'flex flex-col gap-2 bg-(--color-primary-bg) p-5'
          : 'flex flex-col gap-2 p-5'
      }
    >
      <div className="wds-caption-2 font-semibold text-(--text-meta)">
        {highlighted ? '지금 보는 표현' : `${on(expression.askedLabel)} 물어봤어요`}
      </div>
      <div
        className={
          highlighted
            ? 'quote text-[20px] font-semibold text-(--color-primary)'
            : 'quote text-[20px] font-semibold text-(--text-primary)'
        }
      >
        {expression.term}
      </div>
      <p className="wds-label-2 text-(--text-neutral)">{expression.meaning}</p>
      <p className="wds-caption-1 mt-1 text-(--text-meta)">
        {book?.title} · p.{expression.page}
      </p>
    </div>
  );
}
