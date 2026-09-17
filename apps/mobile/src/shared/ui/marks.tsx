import Svg, { Circle, Path } from 'react-native-svg';

import { color } from '@/shared/config';

type MarkProps = { size?: number };

/**
 * 빈 자리에 세우는 우리 앱만의 표시. 이모지 대신 만든 이유가 있다 — 이모지는
 * 기기마다 다르게 그려지고, 다른 어디서나 쓰는 것이라 이 화면만의 것이 아니다.
 * 전부 잉크 선 하나와 포인트 색 획 하나로만 그린다. 채우지 않는다 — 채운 그림은
 * 강조가 돼서 빈 화면에서 오히려 눈에 띈다. 빈 자리는 조용해야 맞다.
 */
function Ring({ size = 56, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Circle cx={28} cy={28} r={27} stroke={color.border.default} strokeWidth={1} />
      {children}
    </Svg>
  );
}

/** 서랍이 비었을 때 — 아직 담아둔 표현이 없다 */
export function DrawerMark({ size }: MarkProps) {
  return (
    <Ring size={size}>
      <Path
        d="M17 20a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v18l-11-5-11 5V20Z"
        stroke={color.text.assistive}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M23 26.5 27 30l6.5-7"
        stroke={color.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Ring>
  );
}

/** 그냥 좋아서 담은 문장이 아직 없을 때 — 인용부호 하나 */
export function QuoteMark({ size }: MarkProps) {
  return (
    <Ring size={size}>
      <Path
        d="M21 24c-2.5 1.4-4 3.5-4 6.2 0 2.3 1.6 3.8 3.5 3.8s3.3-1.4 3.3-3.3c0-1.7-1.1-3-2.7-3.3.3-1.4 1.3-2.6 2.9-3.5L21 24Z"
        fill={color.text.assistive}
      />
      <Path
        d="M33 24c-2.5 1.4-4 3.5-4 6.2 0 2.3 1.6 3.8 3.5 3.8s3.3-1.4 3.3-3.3c0-1.7-1.1-3-2.7-3.3.3-1.4 1.3-2.6 2.9-3.5L33 24Z"
        fill={color.primary}
      />
    </Ring>
  );
}

/** 그 밖의 빈 자리 — 지금은 조용하다는 말만 한다 */
export function QuietMark({ size }: MarkProps) {
  return (
    <Ring size={size}>
      <Circle cx={21} cy={28} r={2.1} fill={color.text.assistive} />
      <Circle cx={28} cy={28} r={2.1} fill={color.text.assistive} />
      <Circle cx={35} cy={28} r={2.1} fill={color.primary} />
    </Ring>
  );
}

export type MarkName = 'drawer' | 'sentence' | 'quiet';

export function Mark({ name, size }: { name: MarkName; size?: number }) {
  switch (name) {
    case 'drawer':
      return <DrawerMark size={size} />;
    case 'sentence':
      return <QuoteMark size={size} />;
    case 'quiet':
      return <QuietMark size={size} />;
  }
}
