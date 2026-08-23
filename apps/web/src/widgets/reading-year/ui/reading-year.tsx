import { READING_YEAR } from '@/entities/reading/model/mock';

/** 모바일은 분기만 보여준다. 폭이 있는 화면에서는 1년을 전부 편다. */
const LEVEL_COLOR = [
  'rgba(112,115,124,0.1)',
  'rgba(0,102,255,0.25)',
  'rgba(0,102,255,0.55)',
  'rgba(0,102,255,0.8)',
  'rgba(0,102,255,1)',
];

export function ReadingYear() {
  const { days, streak, weeks } = READING_YEAR;

  return (
    <section className="flex flex-col gap-6 rounded-2xl bg-(--surface-alt) p-6 xl:flex-row xl:items-center xl:justify-between xl:gap-10">
      <div className="shrink-0">
        <div className="wds-heading-2 text-(--text-primary)">
          올해 <span className="text-(--color-primary)">{days}일</span> 읽었어요
        </div>
        <div className="wds-label-2 mt-1.5 text-(--text-meta)">
          연속 {streak}일째 · 어제도 읽었어요
        </div>
      </div>

      <div className="max-w-full shrink-0 overflow-x-auto">
        <div
          className="grid w-max grid-flow-col grid-rows-7 gap-[3px]"
          role="img"
          aria-label={`올해 읽기 기록: 52주 중 ${days}일`}
        >
          {weeks.map((week, w) =>
            week.map((level, d) => (
              <span
                key={`${w}-${d}`}
                className="h-[10px] w-[10px] rounded-[2px]"
                style={{ background: LEVEL_COLOR[level] }}
              />
            )),
          )}
        </div>
        <div className="wds-caption-2 mt-3 flex items-center gap-2 text-(--text-assistive)">
          <span>작년 이맘때</span>
          <span className="h-px flex-1 bg-(--border-default)" />
          <span>이번 주</span>
        </div>
      </div>
    </section>
  );
}
