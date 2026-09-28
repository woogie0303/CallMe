import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAskQuota, useCreateAsk, useSplitLines } from '@/entities/ask/api/ask.api';
import { useBook, useCurrentBook } from '@/entities/book/api/book.api';
import { useSaveItem } from '@/entities/lexical-item/api/item.api';
import { useCreateSentence } from '@/entities/sentence/api/sentence.api';
import type { ApiAskView } from '@/shared/api/types';
import { color, gutter, ink, type } from '@/shared/config';
import { alignSentences, type SentencePlacement } from '@/shared/ocr/align';
import { selectWords, type Selection } from '@/shared/ocr/selection';
import { available, readLines, type OcrWord } from '@/shared/ocr/text-extractor';
import { ActionButton, AppText, HeaderAction, ScreenHeader, Tap } from '@/shared/ui';
import { AskSheet, type SheetPhase } from '@/widgets/capture/ui/ask-sheet';
import { PhotoPicker, type Shot } from '@/widgets/capture/ui/photo-picker';

type Params = { bookId?: string };

/**
 * 촬영 — 읽던 쪽을 찍고, **그 쪽 위에서** 막힌 문장을 짚어 묻는다.
 *
 * 한 화면이다. 예전에는 촬영 → 문장 고르기 → 질문 화면으로 옮겨 다녔고, 옮기는
 * 순간 사진이 사라져서 한 장을 찍어도 문장 하나밖에 못 물었다. 지금은 시트가
 * 사진 위로 올라왔다 내려가므로, 한 쪽에서 막힌 문장을 연달아 물을 수 있다.
 *
 * 글자를 읽는 일은 기기가 하고(Apple Vision / ML Kit), 줄을 문장으로 잇는 일은
 * 서버가 한다 — 앱에서 정규식으로 자르면 답을 내는 모델과 다르게 자른다(ADR-0002).
 * 인식기가 좌표를 함께 주면 사진 위에서 짚고, 아니면 읽어낸 글을 조판해 보여준다.
 *
 * 사진은 기기 밖으로 나가지 않는다. 서버로 가는 것은 읽어낸 글자뿐이다.
 */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [shot, setShot] = useState<Shot | null>(null);
  const [words, setWords] = useState<OcrWord[]>([]);
  const [places, setPlaces] = useState<SentencePlacement[]>([]);
  /** 첫 낱말만 짚어둔 상태 — 끝을 누르면 범위가 정해진다 */
  const [anchor, setAnchor] = useState<number | null>(null);
  const [range, setRange] = useState<Selection | null>(null);
  const [rough, setRough] = useState(false);
  const [reading, setReading] = useState(false);

  /** 지금 짚은 문장과, 그 문장에 대해 받은 답 */
  const [picked, setPicked] = useState<string | undefined>();
  const [answer, setAnswer] = useState<ApiAskView | null>(null);
  const [keep, setKeep] = useState<Set<string>>(new Set());

  const split = useSplitLines();
  const createAsk = useCreateAsk();
  const saveItem = useSaveItem();
  const keepSentence = useCreateSentence();
  const { data: quota } = useAskQuota();
  const { data: current } = useCurrentBook();
  const { data: chosen } = useBook(params.bookId);
  const book = chosen ?? current?.book;
  const left = quota?.remaining ?? 0;

  const phase: SheetPhase = !answer
    ? 'picked'
    : answer.ask.status === 'answered'
      ? 'answered'
      : 'pending';
  const busy = createAsk.isPending || saveItem.isPending || keepSentence.isPending;

  const shoot = async () => {
    if (!camera.current || reading) return;
    setReading(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('사진을 찍지 못했어요.');

      const read = await readLines(photo.uri);
      if (!read.lines.length) throw new Error('글자를 읽지 못했어요. 더 가까이서 찍어보세요.');

      /** 좌표를 준 인식기가 잰 크기가 우선이다 — 좌표가 그 크기에 기대고 있다 */
      setShot({
        uri: photo.uri,
        width: read.width ?? photo.width,
        height: read.height ?? photo.height,
      });
      setWords(read.words);

      /**
       * 낱말 좌표가 오면 서버에 문장을 나눠달라고 하지 않는다 — 짚는 사람이
       * 어디서 막혔는지 이미 알고 있어서, 모델이 한 번 더 나눌 이유가 없다.
       * 좌표가 없을 때만 예전처럼 줄을 보내 문장으로 이어 받는다.
       */
      if (!read.words.length) {
        const result = await split.mutateAsync(read.lines.map((l) => l.text));
        setPlaces(alignSentences(read.lines, result.sentences));
        setRough(result.rough);
      } else {
        setPlaces([]);
        setRough(false);
      }
    } catch (error) {
      Alert.alert('다시 찍어볼까요', error instanceof Error ? error.message : '');
    } finally {
      setReading(false);
    }
  };

  const retake = () => {
    setShot(null);
    setWords([]);
    setPlaces([]);
    closeSheet();
  };

  const closeSheet = () => {
    setPicked(undefined);
    setAnswer(null);
    setKeep(new Set());
    setAnchor(null);
    setRange(null);
  };

  /**
   * 첫 낱말 → 끝 낱말 순으로 한 번씩. 범위가 정해진 뒤에 또 누르면 처음부터
   * 다시 고른다 — 고쳐 고르려고 취소 버튼을 따로 찾게 만들지 않는다.
   */
  const tapWord = (index: number) => {
    if (range) {
      setRange(null);
      setAnchor(index);
      setPicked(undefined);
      setAnswer(null);
      return;
    }
    if (anchor === null) {
      setAnchor(index);
      return;
    }
    const next = selectWords(words, anchor, index);
    if (!next) return;
    setRange(next);
    setAnchor(null);
    setPicked(next.text);
  };

  const ask = async () => {
    if (!book || !picked || busy) return;
    try {
      const view = await createAsk.mutateAsync({ bookId: book.id, text: picked });
      setAnswer(view);
      /** 답이 왔으면 후보를 전부 골라둔 채로 시작한다 — 빼는 편이 고르는 것보다 빠르다 */
      setKeep(new Set(view.ask.candidates.map((c) => c.term)));
    } catch (error) {
      Alert.alert('묻지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  /** 뜻은 몰라도 되고 그냥 좋았던 문장 — 질문 횟수를 쓰지 않는다 */
  const keepOnly = async () => {
    if (!book || !picked || busy) return;
    try {
      await keepSentence.mutateAsync({ bookId: book.id, text: picked });
      closeSheet();
    } catch (error) {
      Alert.alert('담지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  /** 고른 표현을 서랍에 담는다. 이미 있던 표현이면 그 자리에서 재회가 된다. */
  const keepPicked = async () => {
    if (!answer?.sentence || busy) return;
    try {
      for (const c of answer.ask.candidates.filter((x) => keep.has(x.term))) {
        await saveItem.mutateAsync({
          term: c.term,
          meaning: c.meaning,
          register: c.register,
          surface: c.surface,
          sentenceId: answer.sentence._id,
        });
      }
      closeSheet();
    } catch (error) {
      Alert.alert('담지 못했어요', error instanceof Error ? error.message : '');
    }
  };

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
  if (!shot) {
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
          <Tap
            style={styles.shutter}
            onPress={shoot}
            disabled={reading}
            accessibilityRole="button"
            accessibilityLabel="찍기">
            <View style={styles.shutterCore} />
          </Tap>
        </View>
      </View>
    );
  }

  /* ── 찍은 뒤: 쪽 위에서 문장 짚기 ─────────────────────────── */
  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={retake}
        title={picked ? undefined : '막힌 곳을 짚어보세요'}
        trailing={<HeaderAction label="다시 찍기" tone={color.text.meta} onPress={retake} />}
      />

      <View style={styles.stage}>
        <PhotoPicker
          shot={shot}
          words={words}
          placements={places}
          selection={range}
          anchor={anchor}
          onTapWord={tapWord}
          selected={picked}
          onSelectSentence={(sentence) => {
            if (sentence === picked) return;
            setAnswer(null);
            setKeep(new Set());
            setPicked(sentence);
          }}
        />
      </View>

      {rough && !picked ? (
        <AppText style={[styles.rough, { paddingBottom: insets.bottom + 10 }]}>
          지금은 문장을 거칠게 나눴어요 — 짚은 다음 손으로 고칠 수 있어요.
        </AppText>
      ) : null}

      {picked ? (
        <AskSheet
          sentence={picked}
          phase={phase}
          translation={answer?.ask.translation}
          candidates={answer?.ask.candidates ?? []}
          picked={keep}
          quotaLeft={left}
          busy={busy}
          pendingReason={answer?.ask.pendingReason}
          onTogglePick={(term) =>
            setKeep((prev) => {
              const next = new Set(prev);
              if (next.has(term)) next.delete(term);
              else next.add(term);
              return next;
            })
          }
          onAsk={ask}
          onKeepOnly={keepOnly}
          onKeep={keepPicked}
          onClose={closeSheet}
        />
      ) : null}
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
  /** 찍은 쪽이 화면을 채운다. 시트는 이 위로 올라온다. */
  stage: {
    flex: 1,
    marginHorizontal: gutter,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },

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
    backgroundColor: ink(0.55),
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
  shutterCore: { width: 52, height: 52, borderRadius: 26, backgroundColor: color.text.primary },

  rough: {
    ...type.caption1,
    color: color.status.cautionary,
    lineHeight: 18,
    paddingHorizontal: gutter,
  },

  notice: { flex: 1, paddingHorizontal: gutter, paddingTop: 40, gap: 10 },
  noticeTitle: { ...type.heading2, color: color.text.primary, lineHeight: 30 },
  noticeBody: { ...type.label1, color: color.text.secondary, lineHeight: 23 },

  footer: { paddingHorizontal: gutter, paddingTop: 12 },
});
