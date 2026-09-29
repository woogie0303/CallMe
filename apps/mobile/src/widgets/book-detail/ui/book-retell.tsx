import { StyleSheet, View } from 'react-native';

import type { ApiRetell } from '@/entities/retell/api/retell.api';
import { color, type } from '@/shared/config';
import { ActionButton, AltPanel, AppText, EmptyState, Quote } from '@/shared/ui';

/**
 * 책 화면 안의 리텔링 자리.
 *
 * 여기서 다 보여주지 않는다 — 옮겨 적는 일은 화면을 통째로 써야 해서 눌러서
 * 들어간다. 이 자리가 할 일은 **이 책을 어디까지 제 말로 옮겼는지** 알려주고
 * 이어서 열어주는 것뿐이다.
 */
export function BookRetell({
  session,
  onOpen,
}: {
  session?: ApiRetell;
  onOpen?: () => void;
}) {
  if (!session) {
    return (
      <View style={styles.empty}>
        <EmptyState
          mark="sentence"
          compact
          title="아직 이 책을 제 말로 옮겨 적은 적이 없어요"
        />
        <ActionButton label="리텔링 시작하기" variant="subtle" onPress={onOpen} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <AltPanel style={styles.panel}>
        <AppText style={styles.chapter}>{session.chapter}</AppText>
        {/* 내가 쓴 영어도 책의 영어와 같은 세리프로 조판한다 — 리텔링 화면과 한 벌이다 */}
        <Quote numberOfLines={3} style={styles.draft}>
          {session.draft}
        </Quote>
      </AltPanel>
      <ActionButton label="새로 옮겨 적기" variant="subtle" onPress={onOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  panel: { padding: 16, gap: 8 },
  chapter: { ...type.caption1, color: color.text.meta },
  draft: { fontSize: 14, lineHeight: 21, color: color.text.body },
  empty: { gap: 4 },
});
