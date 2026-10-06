import { Image, View } from 'react-native';

import { color } from '@/shared/config';

/**
 * 빈 자리·막힌 자리·기다리는 자리마다 세우는 우리 앱만의 캐릭터.
 *
 * 전에는 잉크 선 하나로만 그린 조용한 표시였다 — 채운 그림은 강조가 돼서 빈
 * 화면에서 오히려 눈에 띈다는 이유였다. 캐릭터로 바꾼 지금은 그 반대를 고른
 * 것이다: 답을 못 받았을 때, 질문을 다 썼을 때, 사진에서 글자를 못 읽었을
 * 때처럼 사용자가 손해를 보는 순간에도 앱이 무심하지 않다는 것을 보이려 한다.
 * 그래서 이름도 '조용함'이 아니라 그 순간이 무엇인지로 짓는다.
 */
const SOURCES = {
  /** 아직 아무것도 없는 자리 — 책이든 문장이든, 처음이라 비어 있다 */
  empty: require('../../../assets/images/marks/empty.png'),
  /** 검색이 빈 손으로 돌아왔다 */
  'no-results': require('../../../assets/images/marks/no-results.png'),
  /** 요청이 막혔다 — 네트워크든 서버든, 잠시 뒤에 다시 */
  blocked: require('../../../assets/images/marks/blocked.png'),
  /** 답이 아직 오지 않은 문장이 있다 */
  waiting: require('../../../assets/images/marks/waiting.png'),
  /** 읽은 기록이 아직 쌓이지 않았다 */
  'no-history': require('../../../assets/images/marks/no-history.png'),
  /** 이번 달 질문을 다 썼다 */
  'quota-done': require('../../../assets/images/marks/quota-done.png'),
  /** 찾는 것을 끝내 찾지 못했다 */
  'not-found': require('../../../assets/images/marks/not-found.png'),
  /** 사진에서 글자를 읽어내지 못했다 */
  'ocr-failed': require('../../../assets/images/marks/ocr-failed.png'),
  /** 표현을 다시 만났다 — 이 앱에서 몇 안 되는 반가운 순간 */
  reunion: require('../../../assets/images/marks/reunion.png'),
} as const;

export type MarkName = keyof typeof SOURCES;

/**
 * `tile`은 캐릭터를 **흰 카드 위에** 올린다. 그림이 투명 배경으로 오려져 있어서 잉크색
 * 바탕 위에 직접 놓으면 윤곽선 바깥의 원본 흰 찌꺼기가 지저분하게 비친다 — 어두운
 * 판 위에서는 카드에 담아 세운다.
 */
export function Mark({
  name,
  size = 96,
  tile = false,
}: {
  name: MarkName;
  size?: number;
  tile?: boolean;
}) {
  const image = (
    <Image
      source={SOURCES[name]}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
    />
  );
  if (!tile) return image;

  const pad = Math.round(size * 0.14);
  return (
    <View
      style={{
        padding: pad,
        borderRadius: Math.round(size * 0.28),
        backgroundColor: color.surface.card,
      }}
    >
      {image}
    </View>
  );
}

export const MARK_NAMES = Object.keys(SOURCES) as MarkName[];
