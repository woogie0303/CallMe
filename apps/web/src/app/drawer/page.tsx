import { ExpressionDrawer } from '@/widgets/expression-drawer/ui/expression-drawer';

export const metadata = { title: '문장 서랍 — Reread' };

export default function DrawerPage() {
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-8 py-10 xl:px-12">
      <header>
        <h1 className="wds-title-1 text-(--text-primary)">문장 서랍</h1>
        <p className="wds-body-2 mt-2 text-(--text-secondary)">
          표현 128개를 모았고, 그중 31개는 아직 헷갈린다고 표시해뒀어요.
        </p>
      </header>
      <ExpressionDrawer />
    </div>
  );
}
