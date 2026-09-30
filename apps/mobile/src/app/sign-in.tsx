import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProviderName } from '@/shared/api/types';
import { color, gutter, type } from '@/shared/config';
import { configured, SignInCancelled, SignInFailed } from '@/shared/session/oauth';
import { useSession } from '@/shared/session/session';
import { ActionButton, AppText, BRAND, BrandLogo, Quote, Tap } from '@/shared/ui';

/**
 * 한국 독자가 가장 많이 쓰는 순서. Apple은 크기와 자리가 다른 것과 같아야 한다 —
 * 더 작거나 구석에 두면 심사에서 걸린다(Apple 로그인 가이드라인).
 */
const PROVIDERS: ProviderName[] = ['kakao', 'naver', 'google', 'apple'];

/**
 * 로그인 — 가입과 로그인을 나누지 않는다. 처음 온 계정이면 독자를 만들고
 * 아니면 있던 독자로 이어진다. 비밀번호는 만들지 않는다.
 *
 * 버튼은 글자 없이 로고만 둔다. 넷을 "○○로 계속하기"로 쌓으면 화면 아래 절반이
 * 버튼으로 차서, 위의 문장(이 앱이 무엇인지)보다 버튼이 먼저 읽힌다. 로고는
 * 모두 알아보는 모양이라 글자가 없어도 뜻이 선다 — 스크린리더에는 이름을 준다.
 */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signInAsDeveloper, problem } = useSession();
  const [busy, setBusy] = useState<string | null>(null);

  const attempt = async (label: string, run: () => Promise<void>) => {
    setBusy(label);
    try {
      await run();
    } catch (error) {
      /** 동의 화면을 그냥 닫은 것은 실패가 아니다 */
      if (error instanceof SignInCancelled) return;

      /** 왜 안 됐는지를 말한다 — 조용히 아무 일도 안 일어나면 고칠 수가 없다 */
      if (error instanceof SignInFailed) {
        Alert.alert('로그인하지 못했어요', error.message);
        return;
      }
      Alert.alert('로그인하지 못했어요', error instanceof Error ? error.message : '');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.head}>
        <AppText style={styles.wordmark}>Reread</AppText>
        <Quote style={styles.line}>
          “I could not make out whether it was a statue or a person.”
        </Quote>
        <AppText style={styles.blurb}>
          원서를 읽다 막힌 문장을 담아두면,{'\n'}나중에 다시 만날 때 이어드려요.
        </AppText>
      </View>

      <View style={styles.foot}>
        {/* 자동으로 들어가려다 막혔으면 왜인지 그대로 보여준다 — 대개 백엔드가 꺼져 있다 */}
        {problem ? <AppText style={styles.problem}>{problem}</AppText> : null}

        <View style={styles.divider} accessibilityRole="header">
          <View style={styles.rule} />
          <AppText style={styles.dividerText}>간편 로그인</AppText>
          <View style={styles.rule} />
        </View>

        <View style={styles.row}>
          {PROVIDERS.map((name) => (
            <ProviderButton
              key={name}
              name={name}
              ready={configured(name)}
              loading={busy === name}
              locked={busy !== null && busy !== name}
              onPress={() => attempt(name, () => signIn(name))}
            />
          ))}
        </View>

        {/* 개발용. 소셜 로그인이 실제로 도는 것을 확인하면 이 버튼을 지운다. */}
        {__DEV__ ? (
          <ActionButton
            label="개발용으로 들어가기"
            variant="ink"
            disabled={busy !== null && busy !== 'dev'}
            loading={busy === 'dev'}
            onPress={() => attempt('dev', signInAsDeveloper)}
            style={styles.dev}
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * 로고 하나짜리 동그란 버튼.
 *
 * 아직 쓸 수 없는 제공자(키가 없거나, Apple처럼 이 빌드에 권한이 없는 것)는
 * 흐리게 두고 누르지 못하게 한다 — 숨기지 않는다. 사라지면 '이 앱은 Apple
 * 로그인이 없구나'로 읽히고, 흐리면 '아직 안 됨'으로 읽힌다.
 */
function ProviderButton({
  name,
  ready,
  loading,
  locked,
  onPress,
}: {
  name: ProviderName;
  ready: boolean;
  loading: boolean;
  /** 다른 제공자로 로그인하는 중 — 두 창이 겹쳐 뜨지 않게 막는다 */
  locked: boolean;
  onPress: () => void;
}) {
  const brand = BRAND[name];
  const off = !ready || locked || loading;
  /** 로딩 표시는 로고와 같은 색으로 — 노란 바탕에 흰 스피너는 안 보인다 */
  const spinner = name === 'naver' || name === 'apple' ? '#FFFFFF' : '#000000';

  return (
    <Tap
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={ready ? `${brand.label}로 로그인` : `${brand.label}로 로그인, 준비 중`}
      accessibilityState={{ disabled: off, busy: loading }}
      style={[
        styles.circle,
        { backgroundColor: brand.background },
        brand.border ? { borderWidth: 1, borderColor: brand.border } : null,
        !ready ? styles.unready : null,
      ]}>
      {loading ? <ActivityIndicator color={spinner} /> : <BrandLogo name={name} />}
    </Tap>
  );
}

const CIRCLE = 56;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    backgroundColor: color.surface.base,
  },
  head: { gap: 18 },
  wordmark: { ...type.title2, fontSize: 26, letterSpacing: -0.78, color: color.text.primary },
  /** 책에서 온 영어만 세리프 */
  line: { fontSize: 22, lineHeight: 33, color: color.text.primary },
  blurb: { ...type.label1, lineHeight: 23, color: color.text.secondary },

  foot: { gap: 20 },
  problem: { ...type.caption1, lineHeight: 18, color: color.status.cautionary },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color.border.default },
  dividerText: { ...type.caption1, color: color.text.secondary },

  row: { flexDirection: 'row', justifyContent: 'center', gap: 18 },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 아직 쓸 수 없는 것 — 브랜드 색은 지키되 흐리게 */
  unready: { opacity: 0.32 },

  dev: { marginTop: 4 },
});
