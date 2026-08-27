import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { itemById } from '@/entities/lexical-item/model/mock';
import { color, type } from '@/shared/config';
import { AppText, ScreenHeader } from '@/shared/ui';
import { ItemDetail } from '@/widgets/item-detail/ui/item-detail';

/** 어휘 항목 하나 — 서랍에서 들어온다. */
export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = itemById(id);

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="back" onLeadingPress={() => router.back()} title="서랍" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        {item ? (
          <ItemDetail
            item={item}
            onOpenItem={(next) => router.push({ pathname: '/item/[id]', params: { id: next } })}
          />
        ) : (
          <AppText style={styles.missing}>담아둔 표현을 찾지 못했어요.</AppText>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  missing: { ...type.label1, color: color.text.assistive, paddingTop: 40, textAlign: 'center' },
});
