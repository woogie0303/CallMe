import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, type } from '@/shared/config';
import { AltPanel, AppText, Icon, Tap } from '@/shared/ui';

/**
 * 읽기 전에 알아두면 좋은 것 — **줄거리가 아니라 문장의 결.**
 *
 * 줄거리를 여기 적지 않는 이유가 둘이다. 하나는 스포일러고, 다른 하나는 더
 * 중요하다 — 원서를 읽다 막히는 이유는 줄거리를 몰라서가 아니라 문장이
 * 낯설어서다. 이 책의 문장이 어떤 결인지(구동사가 잦은지, 대화가 많은지,
 * 한 문장이 긴지) 미리 알면 첫 쪽에서 덜 당황한다.
 *
 * **읽기 시작하면 접힌다.** 이름이 '읽기 전에'인 만큼, 아직 안 편 책에서는
 * 펼쳐져 있다가 진도가 한 쪽이라도 나가면 접혀서 자리를 내준다 — 그 자리는
 * 그때부터 내가 쌓은 것의 몫이다. 접혀도 사라지지는 않는다: 오래 쉬었다
 * 돌아왔을 때 다시 펴보는 것이 이 글의 두 번째 쓸모다.
 */
export function BookPrimer({
  primer,
  started,
}: {
  primer: string;
  /** 한 쪽이라도 읽었는지 — 읽기 시작했으면 접은 채로 연다 */
  started?: boolean;
}) {
  const [open, setOpen] = useState(!started);

  return (
    <AltPanel style={styles.panel}>
      <Tap
        style={styles.head}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="읽기 전에 알아두면 좋은 것"
        accessibilityHint={open ? '접기' : '펼쳐서 읽기'}>
        <Icon name="bulb" size={15} color={color.primary} />
        <AppText style={styles.label}>읽기 전에</AppText>
        <AppText style={styles.toggle}>{open ? '접기' : '펼치기'}</AppText>
      </Tap>

      {open ? (
        <View style={styles.body}>
          {primer.split('\n\n').map((para, i) => (
            <AppText key={i} style={para.startsWith('·') ? styles.bullet : styles.para}>
              {para}
            </AppText>
          ))}
        </View>
      ) : null}
    </AltPanel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 12, borderRadius: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { flex: 1, ...type.label2, fontWeight: '700', color: color.text.primary },
  toggle: { ...type.caption2, fontWeight: '600', color: color.text.meta },
  body: { gap: 10 },
  /** 앱이 하는 말이라 산세리프. 읽는 글이라 행간을 넉넉히 준다. */
  para: { ...type.label2, lineHeight: 22, color: color.text.body },
  /** 가운뎃점으로 시작하는 줄은 목록이라 조금 들여 쓴다 */
  bullet: { ...type.label2, lineHeight: 21, color: color.text.body, paddingLeft: 2 },
});
