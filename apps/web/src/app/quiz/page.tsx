import { QuizRunner } from '@/widgets/quiz-runner/ui/quiz-runner';

export const metadata = { title: '퀴즈 — Reread' };

export default function QuizPage() {
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-8 py-10 xl:px-12">
      <header>
        <h1 className="wds-title-1 text-(--text-primary)">퀴즈</h1>
        <p className="wds-body-2 mt-2 text-(--text-secondary)">
          헷갈린다고 표시해둔 표현만 골라, 원래 있던 문장 그대로 물어봅니다.
        </p>
      </header>
      <QuizRunner />
    </div>
  );
}
