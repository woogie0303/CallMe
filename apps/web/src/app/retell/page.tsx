import { RetellReview } from '@/widgets/retell-review/ui/retell-review';

export const metadata = { title: '리텔링 — Reread' };

export default function RetellPage() {
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-8 py-10 xl:px-12">
      <header>
        <h1 className="wds-title-1 text-(--text-primary)">리텔링</h1>
        <p className="wds-body-2 mt-2 text-(--text-secondary)">
          방금 읽은 챕터를 내 말로 옮기고, 어디를 고치면 좋을지 나란히 봅니다.
        </p>
      </header>
      <RetellReview />
    </div>
  );
}
