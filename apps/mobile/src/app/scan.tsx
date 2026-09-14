import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSplitLines } from '@/entities/ask/api/ask.api';
import { useBook, useCurrentBook } from '@/entities/book/api/book.api';
import { BookSpine } from '@/entities/book/ui/book-spine';
import { color, type } from '@/shared/config';
import { available, extractText } from '@/shared/ocr/text-extractor';
import { ActionButton, AppText, HeaderAction, ScreenHeader, Tap } from '@/shared/ui';
import { ScannedPage } from '@/widgets/scan/ui/scanned-page';

type Params = { bookId?: string };

/**
 * 04 페이지 촬영 — 찍은 쪽에서 물어볼 문장 하나를 고른다.
 *
 * 글자를 읽는 일은 기기가 하고(Apple Vision / ML Kit), 줄을 문장으로 잇는 일은
 * 서버가 한다. 인식기는 줄 단위로만 돌려주는데 책은 한 문장이 서너 줄에 걸쳐
 * 있어서, 그걸 앱에서 정규식으로 이으면 답을 내는 모델과 다르게 자르게 된다.
 *
 * 사진은 기기 밖으로 나가지 않는다. 서버로 가는 것은 읽어낸 글자뿐이다.
 */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [sentences, setSentences] = useState<string[] | null>(null);
  const [rough, setRough] = useState(false);
  const [reading, setReading] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();

  const split = useSplitLines();
  const { data: current } = useCurrentBook();
  const { data: chosen } = useBook(params.bookId);
  const book = chosen ?? current?.book;

  const shoot = async () => {
    if (!camera.current || reading) return;
    setReading(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('사진을 찍지 못했어요.');

      const lines = await extractText(photo.uri);
      if (!lines.length) throw new Error('글자를 읽지 못했어요. 더 가까이서 찍어보세요.');

      const result = await split.mutateAsync(lines);
      setSentences(result.sentences);
      setRough(result.rough);
    } catch (error) {
      Alert.alert('다시 찍어볼까요', error instanceof Error ? error.message : '');
    } finally {
      setReading(false);
    }
  };

  const retake = () => {
    setSentences(null);
    setSelected(undefined);
  };

  /** 고른 문장을 들고 질문 화면으로 — 거기서 손으로 고칠 수도 있다 */
  const ask = () =>
    router.replace({
      pathname: '/ask',
      params: { text: selected, ...(book ? { bookId: book.id } : {}) },
    });

  if (!available) {
    return (
      <Notice
        title="이 빌드에서는 글자를 읽지 못해요"
        body="글자 인식기는 개발 빌드에서만 돌아요 — Expo Go에서는 안 돼요. 지금은 문장을 직접 적어서 물어볼 수 있어요."
        action="문장 적어서 묻기"
        onPress={() => router.replace('/ask')}
        onBack={() => router.back()}
      />
    );
  }

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <Notice
        title="읽던 쪽을 찍으려면 카메라가 필요해요"
        body="사진은 기기 밖으로 나가지 않아요. 읽어낸 글자만 서버로 가요."
        action="카메라 허용하기"
        onPress={requestPermission}
        onBack={() => router.back()}
      />
    );
  }

  /* ── 찍기 전 ─────────────────────────────────────────────── */
  if (!sentences) {
    return (
      <View style={styles.screen}>
        <ScreenHeader leading="close" onLeadingPress={() => router.back()} title="페이지 촬영" />

        <View style={styles.viewfinder}>
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
          {reading ? (
            <View style={styles.reading}>
              <ActivityIndicator color={color.text.onInk} />
              <AppText style={styles.readingLabel}>글자를 읽는 중이에요…</AppText>
            </View>
          ) : null}
        </View>

        <View style={[styles.shutterRow, { paddingBottom: insets.bottom + 16 }]}>
          <AppText style={styles.guide}>
            {book ? `${book.title} · ` : ''}읽던 쪽이 화면에 다 들어오게 찍어주세요
          </AppText>
          <Tap style={styles.shutter} onPress={shoot} disabled={reading} accessibilityLabel="찍기">
            <View style={styles.shutterCore} />
          </Tap>
        </View>
      </View>
    );
  }

  /* ── 찍은 뒤: 문장 고르기 ────────────────────────────────── */
  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={retake}
        trailing={<HeaderAction label="다시 찍기" tone={color.text.meta} onPress={retake} />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}>
        <View>
          <AppText style={styles.headline}>어느 문장에서{'\n'}막히셨어요?</AppText>
          {book ? (
            <View style={styles.source}>
              <BookSpine book={book} width={18} height={24} radius={3} />
              <AppText style={styles.sourceText}>{book.title} · 방금 촬영</AppText>
            </View>
          ) : null}
        </View>

        {sentences.length ? (
          <ScannedPage sentences={sentences} selected={selected} onSelect={setSelected} />
        ) : (
          <AppText style={styles.empty}>읽어낸 글이 없어요. 더 가까이서 다시 찍어보세요.</AppText>
        )}

        {rough ? (
          <AppText style={styles.rough}>
            지금은 문장을 거칠게 나눴어요 — 어긋난 곳은 다음 화면에서 고칠 수 있어요.
          </AppText>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton
          label={selected ? '이 문장 물어보기' : '문장을 골라주세요'}
          variant={selected ? 'primary' : 'subtle'}
          onPress={selected ? ask : undefined}
        />
      </View>
    </View>
  );
}

/** 찍을 수 없는 자리들 — 막다른 길로 두지 않고 손으로 적는 길을 함께 준다 */
function Notice({
  title,
  body,
  action,
  onPress,
  onBack,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScreenHeader leading="close" onLeadingPress={onBack} title="페이지 촬영" />
      <View style={styles.notice}>
        <AppText style={styles.noticeTitle}>{title}</AppText>
        <AppText style={styles.noticeBody}>{body}</AppText>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <ActionButton label={action} onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 20 },

  /** 뷰파인더는 잉크 위에 둔다 — 종이를 비추는 동안은 화면이 물러나야 한다 */
  viewfinder: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: color.surface.ink,
  },
  reading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(15,15,16,0.55)',
  },
  readingLabel: { ...type.label2, color: color.text.onInk },

  shutterRow: { alignItems: 'center', gap: 14, paddingTop: 4 },
  guide: { ...type.caption1, color: color.text.meta, textAlign: 'center' },
  shutter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: color.text.primary,
  },
  shutterCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.text.primary,
  },

  headline: { ...type.title3, lineHeight: 34, color: color.text.primary },
  source: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  sourceText: { ...type.caption1, color: color.text.meta },
  empty: { ...type.label2, color: color.text.assistive, lineHeight: 21 },
  rough: { ...type.caption1, color: color.status.cautionary, lineHeight: 18 },

  notice: { flex: 1, paddingHorizontal: 24, paddingTop: 40, gap: 10 },
  noticeTitle: { ...type.heading2, color: color.text.primary, lineHeight: 30 },
  noticeBody: { ...type.label1, color: color.text.secondary, lineHeight: 23 },

  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
