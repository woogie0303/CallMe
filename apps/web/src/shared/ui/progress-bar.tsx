import { cn } from '@/shared/lib/cn';

export function ProgressBar({
  value,
  className,
  onInk = false,
}: {
  /** 0~1 */
  value: number;
  className?: string;
  onInk?: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'h-1 overflow-hidden rounded-full',
        onInk ? 'bg-[rgba(255,255,255,0.14)]' : 'bg-(--fill-bold)',
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-(--color-primary) transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
