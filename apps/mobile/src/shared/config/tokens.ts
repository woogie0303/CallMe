/**
 * Wanted Design System 토큰.
 *
 * 값은 apps/web/src/app/globals.css와 한 벌이다 — 두 앱이 같은 팔레트를 쓰는 것이
 * 이 디자인의 전제다. 화면에서 새 색을 만들지 않는다.
 *
 * 알파 헬퍼는 디자인 시스템의 원색(primitive)에서만 파생된다.
 */

/** 잉크(#0F0F10) 위에 얹는 흰색 */
export const onInk = (a: number) => `rgba(255,255,255,${a})`;
/** 흰 바탕 위 라벨색 — Wanted label 계열 */
export const slate = (a: number) => `rgba(23,23,25,${a})`;
/** 중립 채움 — Wanted fill 계열 */
export const neutral = (a: number) => `rgba(112,115,124,${a})`;
/** Wanted 블루 */
export const blue = (a: number) => `rgba(0,102,255,${a})`;

export const color = {
  /* --- brand ---------------------------------------------------------- */
  primary: '#0066FF',
  primaryStrong: '#005EEB',
  primaryBg: blue(0.06),
  primaryBgSoft: blue(0.05),
  primaryTint: blue(0.1),
  primaryLine: blue(0.2),
  accent: '#6541F2',

  /* --- text ----------------------------------------------------------- */
  text: {
    primary: '#171717',
    neutral: slate(0.88),
    body: slate(0.72),
    secondary: slate(0.61),
    meta: slate(0.45),
    faint: slate(0.4),
    assistive: slate(0.28),
    onInk: '#FFFFFF',
    onInkStrong: onInk(0.92),
    onInkBody: onInk(0.9),
    onInkMuted: onInk(0.55),
    onInkSecondary: onInk(0.5),
    onInkMeta: onInk(0.45),
    onInkAssistive: onInk(0.42),
    onInkFaint: onInk(0.4),
  },

  /* --- surface -------------------------------------------------------- */
  surface: {
    base: '#FFFFFF',
    alt: '#F7F7F8',
    card: '#FFFFFF',
    /** 잉크 — 지금 집중해야 할 것 하나에만 쓴다 */
    ink: '#0F0F10',
    /** 종이 — 촬영된 책 페이지 */
    page: '#EFEDE8',
    /** 캔버스 배경(디자인 문서의 바깥 여백) */
    canvas: '#17171A',
  },

  /* --- fill / line ---------------------------------------------------- */
  fill: {
    subtle: neutral(0.05),
    default: neutral(0.06),
    normal: neutral(0.08),
    bold: neutral(0.16),
    onInk: onInk(0.08),
    onInkStrong: onInk(0.1),
  },
  border: {
    hairline: neutral(0.08),
    subtle: neutral(0.1),
    default: neutral(0.12),
    strong: neutral(0.14),
    onInk: onInk(0.1),
  },

  /* --- status --------------------------------------------------------- */
  status: {
    positive: '#00BF40',
    positiveText: '#00A537',
    positiveBg: 'rgba(0,191,64,0.1)',
    cautionary: '#FF9200',
    negative: '#FF4242',
  },
} as const;

/** 책등 그라디언트 — 라벨 없이 출처를 알려주는 색 */
export const spineGradient = {
  /** CSS의 linear-gradient(150deg, …)를 단위 사각형 좌표로 옮긴 값 */
  start: { x: 0.25, y: 0.07 },
  end: { x: 0.75, y: 0.93 },
} as const;

/** Wanted의 그림자는 옅고 퍼짐이 적다. */
export const shadow = {
  card: {
    shadowColor: '#171717',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cover: {
    shadowColor: '#171717',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  primary: {
    shadowColor: '#0066FF',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fab: {
    shadowColor: '#0066FF',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
