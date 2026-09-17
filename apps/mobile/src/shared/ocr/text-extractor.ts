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
 * 지금 쓰는 `expo-text-extractor`는 글자만 주고 좌표를 주지 않는다(`string[]`).
 * 그래서 이 파일은 좌표를 **선택으로** 다룬다 — 주는 인식기로 갈아끼우면
 * (`@react-native-ml-kit/text-recognition`의 `blocks[].lines[].frame`) 화면이
 * 저절로 사진 위 오버레이로 올라가고, 없으면 글자만 다시 조판해 보여준다.
 *
 * 갈아끼울 자리는 `readLines` 하나다. 화면은 이 모양만 알면 된다.
 */

/** 읽어낸 줄 하나. `frame`은 주는 인식기에서만 온다. */
export type OcrLine = {
  text: string;
  /** 사진의 픽셀 좌표계. 화면에 올릴 때 표시 크기로 환산해야 한다. */
  frame?: { x: number; y: number; width: number; height: number };
};

/** 한 장에서 읽어낸 결과 */
export type OcrResult = {
  lines: OcrLine[];
  /** 좌표가 함께 왔는지 — 사진 위에 얹을 수 있는지를 이 값으로 정한다 */
  located: boolean;
};

type TextExtractor = {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
};

function load(): TextExtractor | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-text-extractor') as TextExtractor;
  } catch {
    return null;
  }
}

const module = load();

/** 이 기기에서 사진의 글자를 읽을 수 있는지 */
export const available: boolean = Boolean(module?.isSupported);

/**
 * 사진에서 줄들을 읽어낸다.
 *
 * 지금 인식기는 좌표를 주지 않으므로 `located: false`로 돌아온다. 좌표를 주는
 * 인식기로 바꾸는 날, 바꿀 것은 이 함수 안뿐이다.
 */
export async function readLines(uri: string): Promise<OcrResult> {
  if (!module) throw new Error('이 빌드에는 글자 인식기가 들어 있지 않아요.');
  const lines = await module.extractTextFromImage(uri);
  return { lines: lines.map((text) => ({ text })), located: false };
}

/** 글자만 필요할 때 — 문장으로 잇는 일은 서버가 한다 */
export async function extractText(uri: string): Promise<string[]> {
  const { lines } = await readLines(uri);
  return lines.map((l) => l.text);
}
