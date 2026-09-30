import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LEVELS } from '@/entities/reader/model/levels';
import { useReader, useUpdateReader } from '@/entities/reader/api/reader.api';
import type { Level } from '@/shared/api/types';
import { color, gutter, type } from '@/shared/config';
import { ActionButton, AppText, Icon, ScreenHeader, Tap } from '@/shared/ui';

/**
 * 레벨 확인. 처음 한 번과, 책을 한 권 끝낼 때마다 다시 묻는다 —
 * 설정 화면에 묻어두면 아무도 고치지 않고, 반년 전 대답에 갇힌다. (Q24)
 */
export default function LevelScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: reader } = useReader();
  const update = useUpdateReader();
  const [level, setLevel] = useState<Level | null>(null);
  /** 서버 값이 도착하기 전엔 고른 적이 없다는 뜻이다 — 그 값을 그대로 시작점으로 쓴다 */
  const current = level ?? reader?.level;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="close"
        onLeadingPress={() => router.back()}
        title="레벨"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        <View>
          <AppText style={styles.headline}>
            지금 영어는{'\n'}어느 정도인가요?
          </AppText>
          <AppText style={styles.sub}>
            담아둘 만한 표현을 고르는 기준과, 뜻을 얼마나 풀어 쓸지가 달라져요.
            책을 한 권 끝낼 때마다 다시 물어볼게요.
          </AppText>
        </View>

        <View style={styles.options}>
          {LEVELS.map((option) => {
            const on = option.value === current;
            return (
              <Tap
                key={option.value}
                style={[styles.option, on ? styles.optionOn : null]}
                onPress={() => setLevel(option.value)}
                disabled={update.isPending}
              >
                <View style={styles.optionText}>
                  <AppText
                    style={[
                      styles.optionTitle,
                      on ? styles.optionTitleOn : null,
                    ]}
                  >
                    {option.value}
                  </AppText>
                  <AppText style={styles.optionBlurb}>{option.blurb}</AppText>
                </View>
                <View style={[styles.mark, on ? styles.markOn : null]}>
                  {on ? (
                    <Icon name="check" size={13} color={color.text.onInk} />
                  ) : null}
                </View>
              </Tap>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label="이걸로 할게요"
          disabled={!current}
          loading={update.isPending}
          onPress={async () => {
            if (!current) return;
            await update.mutateAsync({ level: current });
            router.back();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: 24, gap: 24 },
  headline: { ...type.title3, color: color.text.primary, lineHeight: 33 },
  sub: {
    ...type.label1,
    lineHeight: 22,
    color: color.text.secondary,
    marginTop: 10,
  },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: color.surface.base,
    borderWidth: 1,
    borderColor: color.border.strong,
  },
  optionOn: {
    borderWidth: 1.5,
    borderColor: color.primary,
    backgroundColor: color.primaryBgSoft,
  },
  optionText: { flex: 1, gap: 4 },
  optionTitle: {
    ...type.headline2,
    fontWeight: '700',
    color: color.text.primary,
  },
  optionTitleOn: { color: color.primary },
  optionBlurb: { ...type.label2, color: color.text.secondary },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: color.border.strong,
  },
  markOn: { backgroundColor: color.primary, borderColor: color.primary },
  footer: { paddingHorizontal: gutter, paddingTop: 12 },
});
