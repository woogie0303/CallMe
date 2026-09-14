/**
 * 기기에서 글자를 읽는 일 — iOS는 Apple Vision, Android는 ML Kit.
 *
 * 네이티브 모듈이라 **없을 수 있다.** Expo Go거나, 모듈을 넣고 나서 아직 개발
 * 빌드를 다시 만들지 않았으면 없다. 그때 최상단에서 import하면 화면 파일 자체가
 * 끝까지 평가되지 못해 default export가 사라지고, 촬영 화면이 통째로 죽는다 —
 * 그래서 여기서 한 번 감싸 잡아두고, 없으면 없다고만 말한다.
 *
 * 부르는 쪽은 `available`을 보고 손으로 적는 길로 물러난다.
 */
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

export async function extractText(uri: string): Promise<string[]> {
  if (!module) throw new Error('이 빌드에는 글자 인식기가 들어 있지 않아요.');
  return module.extractTextFromImage(uri);
}
