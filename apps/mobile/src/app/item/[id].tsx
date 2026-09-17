import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useItem } from '@/entities/lexical-item/api/item.api';
import { color, gutter, type } from '@/shared/config';
import { AppText, ScreenHeader } from '@/shared/ui';
import { ItemDetail } from '@/widgets/item-detail/ui/item-detail';

/** 어휘 항목 하나 — 서랍에서 들어온다. */
export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: detail, isPending, error } = useItem(id);
  /** 헷갈리는 짝은 표제형 하나만 있으면 되므로 따로 한 번 더 물어본다 */
  const { data: twin } = useItem(detail?.item.confusedWith?.itemId);

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="back" onLeadingPress={() => router.back()} title="서랍" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {isPending ? (
          <ActivityIndicator style={styles.spinner} color={color.text.assistive} />
        ) : detail ? (
          <ItemDetail
            detail={detail}
            twinTerm={twin?.item.term}
            onOpenItem={(next) => router.push({ pathname: '/item/[id]', params: { id: next } })}
          />
        ) : (
          <AppText style={styles.missing}>
            {error?.message ?? '담아둔 표현을 찾지 못했어요.'}
          </AppText>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: 32 },
  spinner: { paddingTop: 40 },
  missing: { ...type.label1, color: color.text.secondary, paddingTop: 40, textAlign: 'center' },
});
