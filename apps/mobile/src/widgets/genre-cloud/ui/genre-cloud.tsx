import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { GenreShare } from "@/entities/reading/model/types";
import { color, type } from "@/shared/config";
import { AppText, Tap } from "@/shared/ui";

/** 낱말 크기가 오갈 수 있는 범위 — 이 안에서 읽은 쪽수 비율로 정해진다 */
const MIN_SIZE = 15;
const MAX_SIZE = 34;

/**
 * 장르를 구름처럼 흩어 보인다 — 홈의 이번 주 그래프를 누르면 오는 화면.
 *
 * 막대 그래프 대신 낱말 크기로 비교하는 이유는, 이번 주 그래프가 이미 '얼마나'를
 * 막대로 말하고 있어서다. 여기는 '무엇을'을 말하는 자리라 다른 그림이어야
 * 같은 화면으로 보이지 않는다 — 장르 이름 자체가 크고 작은 것으로 취향을
 * 드러낸다.
 *
 * 낱말 순서를 읽은 양 그대로 두면 큰 것부터 작은 것까지 층이 지어 피라미드처럼
 * 보인다. 가장 크고 작은 것을 번갈아 배치해서(`interleave`) 줄마다 크기가
 * 섞이게 한다 — 구름은 층이 지지 않는다.
 *
 * 쪽수는 누르기 전에는 안 보인다. 크기만으로 대략의 순서는 보이지만, 정확한
 * 쪽수는 궁금해서 눌러본 사람에게만 준다 — 처음부터 다 펴놓으면 글자 크기가
 * 다른 이유가 있다는 사실 자체가 흐려진다.
 */
export function GenreCloud({ shares }: { shares: GenreShare[] }) {
  const known = shares.filter((share) => share.genre !== "장르 없음");
  const unknown = shares.find((share) => share.genre === "장르 없음");
  const maxPages = Math.max(1, ...known.map((share) => share.pages));

  return (
    <View style={styles.cloud}>
      {interleave(known).map((share) => (
        <Word key={share.genre} share={share} maxPages={maxPages} />
      ))}
    </View>
  );
}

function Word({ share, maxPages }: { share: GenreShare; maxPages: number }) {
  const [open, setOpen] = useState(false);
  const weight = share.pages / maxPages;
  const fontSize = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.sqrt(weight);
  const fontWeight = weight > 0.55 ? "800" : weight > 0.3 ? "700" : "500";

  return (
    <Tap
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${share.genre}, ${share.pages}쪽`}
    >
      <AppText
        style={[
          styles.word,
          { fontSize, fontWeight },
          open ? styles.wordOpen : null,
        ]}
      >
        {share.genre}
        {open ? (
          <AppText style={styles.pages}> · {share.pages}쪽</AppText>
        ) : null}
      </AppText>
    </Tap>
  );
}

/** [큰 것, 가장 작은 것, 다음 큰 것, 다음 작은 것 …] 순으로 섞는다 */
function interleave(shares: GenreShare[]): GenreShare[] {
  const sorted = [...shares].sort((a, b) => b.pages - a.pages);
  const out: GenreShare[] = [];
  let lo = 0;
  let hi = sorted.length - 1;
  let fromLow = false;
  while (lo <= hi) {
    if (fromLow) {
      out.push(sorted[lo]);
      lo += 1;
    } else {
      out.push(sorted[hi]);
      hi -= 1;
    }
    fromLow = !fromLow;
  }
  return out;
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  cloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    gap: 16,
    paddingVertical: 12,
  },
  word: { color: color.primary },
  /** 눌러서 편 낱말은 밑줄로 표시한다 — 서랍 카드의 밑줄과 같은 말이다 */
  wordOpen: {
    textDecorationLine: "underline",
    textDecorationColor: color.primaryLine,
  },
  pages: { fontSize: 13, fontWeight: "600", color: color.text.meta },
  footnote: {
    ...type.caption1,
    color: color.text.meta,
    textAlign: "center",
    lineHeight: 18,
  },
});
