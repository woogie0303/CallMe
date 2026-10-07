import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import {
  AltPanel,
  AppText,
  Card,
  Icon,
  Quote,
  emphasis,
} from '@/shared/ui';

/**
 * 안내 화면의 그림 셋 — 실제 화면을 사진으로 박지 않고 **앱이 쓰는 조각 그대로** 조립한다.
 * 그래야 안내에서 본 모양과 나중에 만나는 화면이 어긋나지 않는다(색·서체가 바뀌면 같이 바뀐다).
 *
 * 예문은 퍼블릭 도메인 원문(샬럿 브론테의 『제인 에어』)이다. 서체 규칙도 그대로다 —
 * 책에서 온 영어는 세리프, 앱이 하는 말은 산세리프.
 */

/*
 * 1번(찍은 쪽 위에서 낱말을 고른다)은 손짓을 움직여 보여야 해서 `pick-demo.tsx`에 따로 있다.
 */

/** 2. 문장째로 묻고, 뜻은 눌러야 열린다 */
export function AskPreview() {
  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <Quote style={styles.sentence}>
          {'I was puzzling to '}
          <Quote style={styles.marked}>make out</Quote>
          {' the subject of a picture on the wall.'}
        </Quote>
      </Card>
      <AltPanel style={styles.meaning}>
        <View style={styles.reveal}>
          <AppText style={styles.revealLabel}>뜻 닫기</AppText>
        </View>
        <AppText style={styles.meaningText}>
          나는 벽에 걸린 그림이 무엇을 그린 것인지 알아내려 끙끙대고 있었다.
        </AppText>
        <AppText style={styles.term}>
          <Quote style={styles.termQuote}>make out</Quote>
          {'  알아보다, 분간하다'}
        </AppText>
      </AltPanel>
    </View>
  );
}

/** 3. 다른 책에서 다시 만나면 처음 만난 때와 이어준다 */
export function ReunionPreview() {
  return (
    <Card style={styles.reunion}>
      <Quote style={styles.reunionTerm}>make out</Quote>
      <AppText style={styles.reunionMeaning}>
        알아보다, 분간하다 · 이해하다
      </AppText>
      <View style={styles.gapRow}>
        <Icon name="clock" size={14} color={color.primary} />
        <AppText style={styles.gapText} lineBreakStrategyIOS="hangul-word">
          2권에서 2번 만났어요 — 처음 담은 뒤{' '}
          <AppText style={emphasis(color.primary)}>3개월 만에</AppText> 다시
          만났어요
        </AppText>
      </View>
      <View style={styles.books}>
        <AppText style={styles.bookLine}>
          Alice&apos;s Adventures in Wonderland · 6월
        </AppText>
        <AppText style={styles.bookLine}>Jane Eyre · 9월</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },

  card: { padding: 18 },
  sentence: { fontSize: 17, lineHeight: 27 },
  /** 담은 표현의 밑줄(`sentence-detail`의 marked와 같다) */
  marked: {
    color: color.primary,
    textDecorationLine: 'underline',
    textDecorationColor: color.primaryLine,
  },

  meaning: { padding: 16, gap: 10 },
  reveal: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: color.fill.default,
  },
  revealLabel: {
    ...type.label2,
    fontWeight: '600',
    color: color.text.secondary,
  },
  meaningText: { ...type.body2, lineHeight: 23, color: color.text.body },
  term: { ...type.label1, color: color.text.secondary },
  termQuote: { fontSize: 15, color: color.text.primary },

  reunion: { padding: 22, gap: 12 },
  reunionTerm: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    color: color.text.primary,
  },
  reunionMeaning: { ...type.body2, color: color.text.body },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: color.primaryTint,
  },
  gapText: {
    flex: 1,
    ...type.caption1,
    lineHeight: 17,
    color: color.text.body,
  },
  books: { gap: 4, marginTop: 2 },
  bookLine: { ...type.caption1, color: color.text.meta },
});
