import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProviderName } from '@/shared/api/types';
import { color, type } from '@/shared/config';
import { configured, SignInCancelled } from '@/shared/session/oauth';
import { useSession } from '@/shared/session/session';
import { ActionButton, AppText, Quote } from '@/shared/ui';

const PROVIDERS: { name: ProviderName; label: string }[] = [
  { name: 'kakao', label: '카카오로 계속하기' },
  { name: 'naver', label: '네이버로 계속하기' },
  { name: 'google', label: 'Google로 계속하기' },
];

/**
 * 로그인 — 가입과 로그인을 나누지 않는다. 처음 온 계정이면 독자를 만들고
 * 아니면 있던 독자로 이어진다. 비밀번호는 만들지 않는다.
 */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signInAsDeveloper } = useSession();
  const [busy, setBusy] = useState<string | null>(null);

  const attempt = async (label: string, run: () => Promise<void>) => {
    setBusy(label);
    try {
      await run();
    } catch (error) {
      /** 동의 화면을 그냥 닫은 것은 실패가 아니다 */
      if (!(error instanceof SignInCancelled)) {
        Alert.alert('로그인하지 못했어요', error instanceof Error ? error.message : '');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.head}>
        <AppText style={styles.wordmark}>Reread</AppText>
        <Quote style={styles.line}>
          “I could not make out whether it was a statue or a person.”
        </Quote>
        <AppText style={styles.blurb}>
          원서를 읽다 막힌 문장을 담아두면,{'\n'}나중에 또 헷갈릴 때 다시 이어드려요.
        </AppText>
      </View>

      <View style={styles.buttons}>
        {PROVIDERS.map((provider) => (
          <ActionButton
            key={provider.name}
            label={provider.label}
            variant={provider.name === 'kakao' ? 'primary' : 'subtle'}
            aside={configured(provider.name) ? undefined : '준비 중'}
            onPress={() => attempt(provider.name, () => signIn(provider.name))}
          />
        ))}

        {/* 개발용. 소셜 로그인이 실제로 도는 것을 확인하면 이 버튼을 지운다. */}
        {__DEV__ ? (
          <ActionButton
            label={busy === 'dev' ? '들어가는 중…' : '개발용으로 들어가기'}
            variant="ink"
            onPress={() => attempt('dev', signInAsDeveloper)}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: color.surface.base,
  },
  head: { gap: 18 },
  wordmark: { ...type.title2, fontSize: 26, letterSpacing: -0.78, color: color.text.primary },
  /** 책에서 온 영어만 세리프 */
  line: { fontSize: 22, lineHeight: 33, color: color.text.primary },
  blurb: { ...type.label1, lineHeight: 23, color: color.text.secondary },
  buttons: { gap: 10 },
});
