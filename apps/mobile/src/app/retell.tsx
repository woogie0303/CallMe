import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RETELL_SESSION } from '@/entities/retell/model/mock';
import { color, family, type } from '@/shared/config';
import { ActionButton, AppText, Icon, ScreenHeader, Tap } from '@/shared/ui';
import { RetellFeedback } from '@/widgets/retell-review/ui/retell-feedback';

/**
 * 05 리텔링 — 방금 읽은 챕터를 제 말로 옮겨 적고, 고쳐진 문장을 돌려받는다.
 * 음성은 MVP에 없다: 녹음·STT는 읽기를 돕는 일과 관계가 없다. (Q20)
 */
export default function RetellScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [draft, setDraft] = useState(RETELL_SESSION.draft);
  const [reviewed, setReviewed] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        leading="close"
        onLeadingPress={() => router.replace('/')}
        title={RETELL_SESSION.chapter}
        trailing={
          <Tap hitSlop={12}>
            <Icon name="write" size={20} color={color.text.meta} />
          </Tap>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.prompt}>
          <AppText style={styles.promptTitle}>방금 읽은 챕터를 옮겨 적어보세요</AppText>
          <AppText style={styles.promptHint}>
            틀려도 괜찮아요. 고칠 곳을 찾는 게 이 화면이 하는 일이에요.
          </AppText>
        </View>

        <View style={styles.field}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={!reviewed}
            multiline
            placeholder="Klara watched the sun going down…"
            placeholderTextColor={color.text.assistive}
            style={styles.input}
          />
        </View>

        {reviewed ? (
          <RetellFeedback
            revisions={RETELL_SESSION.revisions}
            missedItemIds={RETELL_SESSION.missedItemIds}
          />
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {reviewed ? (
          <ActionButton label="기록 남기고 닫기" variant="ink" onPress={() => router.replace('/')} />
        ) : (
          <ActionButton label="고칠 곳 찾아보기" onPress={() => setReviewed(true)} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 18 },
  prompt: { gap: 4 },
  promptTitle: { ...type.heading2, fontWeight: '700', color: color.text.primary },
  promptHint: { ...type.label2, color: color.text.meta },
  field: {
    minHeight: 180,
    borderRadius: 20,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.default,
    padding: 18,
  },
  /** 내가 쓰는 영어도 책의 영어와 같은 결이라 세리프다 */
  input: {
    flex: 1,
    fontFamily: family.serif,
    fontSize: 16,
    lineHeight: 26,
    color: color.text.primary,
    textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
