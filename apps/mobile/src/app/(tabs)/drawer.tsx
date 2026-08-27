import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isReencountered } from '@/entities/lexical-item/lib/select';
import { ITEMS } from '@/entities/lexical-item/model/mock';
import { color, type } from '@/shared/config';
import { AppText, Icon, Tap, emphasis } from '@/shared/ui';
import { DrawerList } from '@/widgets/drawer/ui/drawer-list';

/** 서랍 — 담아둔 어휘 항목이 모이는 곳. 항목이 주인이고 문장이 딸린다. */
export default function DrawerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const confused = ITEMS.filter((i) => i.status === '헷갈려요').length;
  const again = ITEMS.filter(isReencountered).length;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headText}>
          <AppText style={styles.title}>서랍</AppText>
          <AppText style={styles.summary}>
            표현 {ITEMS.length}개 · 아직 헷갈리는 건 {confused}개
            {again > 0 ? (
              <AppText style={emphasis(color.primary)}> · 다시 만난 건 {again}개</AppText>
            ) : null}
          </AppText>
        </View>
        <Tap hitSlop={12}>
          <Icon name="search" size={21} color={color.text.primary} />
        </Tap>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <DrawerList onOpenItem={(id) => router.push(`/item/${id}`)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 14,
    gap: 12,
  },
  headText: { flex: 1, gap: 4 },
  title: { ...type.title3, color: color.text.primary },
  summary: { ...type.label2, color: color.text.meta },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
});
