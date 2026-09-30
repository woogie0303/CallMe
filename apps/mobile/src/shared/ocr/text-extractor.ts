/**
 * 기기에서 글자를 읽는 일 — iOS는 Apple Vision, Android는 ML Kit.
 *
 * 네이티브 모듈이라 **없을 수 있다.** Expo Go거나, 모듈을 넣고 나서 아직 개발
 * 빌드를 다시 만들지 않았으면 없다. 그때 최상단에서 import하면 화면 파일 자체가
 * 끝까지 평가되지 못해 default export가 사라지고, 촬영 화면이 통째로 죽는다 —
 * 그래서 여기서 한 번 감싸 잡아두고, 없으면 없다고만 말한다.
 *
 * 부르는 쪽은 `available`을 보고 손으로 적는 길로 물러난다.
 *
 * ## 좌표에 대하여
 *
 * 찍은 사진 **위에서** 문장을 짚으려면 글자가 사진의 어디에 있는지 알아야 한다.
 * iOS는 앱 안의 `modules/page-reader`가 Apple Vision으로 읽고 줄·낱말의 좌표를
 * 함께 준다. `expo-text-extractor`도 같은 Vision을 쓰지만 좌표를 버리고 글자만
 * 넘겨서(`string[]`), 좌표가 필요한 자리에는 쓸 수 없다 — 안드로이드처럼
 * page-reader가 없는 곳에서만 물러날 자리로 남긴다.
 *
 * 화면은 `readLines`가 돌려주는 모양만 안다. `located`가 참이면 사진 위에 얹고,
 * 아니면 글자만 다시 조판해 보여준다.
 */

import { requireOptionalNativeModule } from 'expo';

/**
 * 사진 안의 네모 한 칸. 픽셀 좌표계라 화면에 올릴 때 환산해야 한다.
 *
 * `angle`(라디안, 시계 방향)이 있으면 돌리기 **전**의 네모다 — 중심을 축으로
 * 그만큼 돌려야 글자에 겹친다. 손으로 든 책은 거의 늘 기울어져 찍힌다.
 */
export type OcrFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
};

/** 읽어낸 줄 하나. `frame`은 주는 인식기에서만 온다. */
export type OcrLine = {
  text: string;
  frame?: OcrFrame;
};

/**
 * 낱말 하나. 사진 위에서 **처음 낱말과 끝 낱말을 짚어** 물어볼 범위를 정하려면
 * 줄이 아니라 이 단위가 필요하다 — 한 줄에 여러 문장이 걸치기도 하고, 한 문장이
 * 여러 줄에 걸치기도 해서 줄로는 범위를 못 짚는다.
 *
 * `line`은 몇 번째 줄에 속하는지. 읽는 순서는 배열 순서 그대로다.
 */
export type OcrWord = {
  text: string;
  line: number;
  frame: OcrFrame;
};

/** 한 장에서 읽어낸 결과 */
export type OcrResult = {
  lines: OcrLine[];
  /**
   * 낱말 단위 좌표. 주는 인식기에서만 온다 — 이게 있으면 사진 위에서 짚고,
   * 없으면 읽어낸 글을 조판해 보여주는 쪽으로 물러난다.
   */
  words: OcrWord[];
  /** 좌표가 함께 왔는지 — 사진 위에 얹을 수 있는지를 이 값으로 정한다 */
  located: boolean;
  /**
   * 좌표가 기대는 사진 크기(화면에 보이는 방향 기준). 카메라가 알려주는 크기는
   * 방향을 적용하기 전일 수 있어서, 좌표를 준 쪽의 크기를 그대로 쓴다.
   */
  width?: number;
  height?: number;
};

type TextExtractor = {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
};

type PageReading = {
  width: number;
  height: number;
  lines: { text: string; frame: OcrFrame }[];
  words: OcrWord[];
};

type PageReader = { read: (uri: string) => Promise<PageReading> };

function load(): TextExtractor | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-text-extractor') as TextExtractor;
  } catch {
    return null;
  }
}

const module = load();

/**
 * 좌표까지 주는 인식기 — 앱 안의 `modules/page-reader`(iOS, Apple Vision).
 * 안드로이드와, 이 모듈이 들어가기 전에 지은 빌드에는 없다.
 */
const pageReader = requireOptionalNativeModule<PageReader>('PageReader');

/** 이 기기에서 사진의 글자를 읽을 수 있는지 */
export const available: boolean =
  Boolean(pageReader) || Boolean(module?.isSupported);

/**
 * 사진에서 줄과 낱말을 읽어낸다.
 *
 * 좌표를 주는 인식기가 있으면 그것으로 읽어 `located: true`로 돌려준다. 없으면
 * 글자만 주는 인식기로 물러나 `located: false` — 화면은 조판으로 물러난다.
 */
export async function readLines(uri: string): Promise<OcrResult> {
  if (pageReader) {
    const page = await pageReader.read(uri);
    return {
      lines: page.lines,
      words: page.words,
      located: page.words.length > 0,
      width: page.width,
      height: page.height,
    };
  }

  if (!module) throw new Error('이 빌드에는 글자 인식기가 들어 있지 않아요.');
  const lines = await module.extractTextFromImage(uri);
  return { lines: lines.map((text) => ({ text })), words: [], located: false };
}

/** 글자만 필요할 때 — 문장으로 잇는 일은 서버가 한다 */
export async function extractText(uri: string): Promise<string[]> {
  const { lines } = await readLines(uri);
  return lines.map((l) => l.text);
}
