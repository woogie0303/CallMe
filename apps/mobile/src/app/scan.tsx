import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAskQuota, useCreateAsk } from '@/entities/ask/api/ask.api';
import { useBook, useCurrentBook } from '@/entities/book/api/book.api';
import { useUpdateProgress } from '@/entities/reading/api/reading.api';
import { useCreateSentence } from '@/entities/sentence/api/sentence.api';
import { color, gutter, ink, type } from '@/shared/config';
import { selectWords, type Selection } from '@/shared/ocr/selection';
import {
  available,
  readLines,
  type OcrWord,
} from '@/shared/ocr/text-extractor';
import {
  ActionButton,
  AppText,
  HeaderAction,
  ScreenHeader,
  Tap,
} from '@/shared/ui';
import { AskSheet } from '@/widgets/capture/ui/ask-sheet';
import { PhotoPicker, type Shot } from '@/widgets/capture/ui/photo-picker';

type Params = { bookId?: string };

/**
 * 촬영 — 읽던 쪽을 찍고, **그 쪽 위에서** 막힌 문장을 짚어 묻는다.
 *
 * 짚은 문장은 시트에서 물을지 그냥 담을지만 고르고, 고르는 순간 그 문장이 사는
 * 곳으로 간다 — 물어서 답이 왔으면 문장 화면, 답을 못 받았으면 기다리는 문장,
 * 그냥 담았으면 그 책의 '마음에 들었던 문장'. 한동안은 담은 뒤 사진으로 돌아와
 * 다음 문장을 짚게 했는데, 방금 담은 것이 어디 갔는지 보이지 않았다.
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
  /** 첫 낱말만 짚어둔 상태 — 끝을 누르면 범위가 정해진다 */
  const [anchor, setAnchor] = useState<number | null>(null);
  const [range, setRange] = useState<Selection | null>(null);
  const [reading, setReading] = useState(false);

  /** 지금 짚은 문장 — 인식이 틀렸으면 시트에서 고친 글이 여기 들어간다 */
  const [picked, setPicked] = useState<string | undefined>();
  /** 손대기 전까지는 지난번에 적은 쪽을 따른다 */
  const [pageEdit, setPageEdit] = useState<string>();

  const createAsk = useCreateAsk();
  const keepSentence = useCreateSentence();
  const { data: quota } = useAskQuota();
  const { data: current } = useCurrentBook();
  const { data: chosen } = useBook(params.bookId);
  const book = chosen ?? current?.book;
  const left = quota?.remaining ?? 0;
  const moveProgress = useUpdateProgress(book?.id ?? '');

  const lastPage =
    (current?.book.id === book?.id
      ? current?.progress.currentPage
      : undefined) ??
    book?.currentPage ??
    0;
  const pageText = pageEdit ?? '';
  /** 책에 없는 쪽은 쪽이 아니다 — 시트가 이유를 말하고, 서버도 한 번 더 막는다 */
  const typedPage = Number(pageText);
  const page =
    typedPage > 0 && (!book?.pages || typedPage <= book.pages)
      ? typedPage
      : undefined;

  /** 문장이 있는 쪽까지는 읽은 것이다 — 진도를 앞으로만 옮긴다 */
  const recordPage = () => {
    if (!book || !page || page <= lastPage) return;
    moveProgress.mutate(page);
  };

  const busy = createAsk.isPending || keepSentence.isPending;

  const shoot = async () => {
    if (!camera.current || reading) return;
    setReading(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('사진을 찍지 못했어요.');

      const read = await readLines(photo.uri);
      if (!read.lines.length)
        throw new Error('글자를 읽지 못했어요. 더 가까이서 찍어보세요.');

      /**
       * 낱말 좌표가 없으면 사진 위에서 짚을 수 없다 — 줄을 문장으로 이어 주던 서버
       * 호출은 걷어냈다. 좌표를 주는 곳은 iOS(Apple Vision)뿐이다.
       */
      if (!read.words.length)
        throw new Error(
          '이 기기에서는 사진 위에서 문장을 고를 수 없어요. 직접 적어서 물어봐 주세요.',
        );

      /** 좌표를 준 인식기가 잰 크기가 우선이다 — 좌표가 그 크기에 기대고 있다 */
      setShot({
        uri: photo.uri,
        width: read.width ?? photo.width,
        height: read.height ?? photo.height,
      });
      setWords(read.words);
    } catch (error) {
      Alert.alert(
        '다시 찍어볼까요',
        error instanceof Error ? error.message : '',
      );
    } finally {
      setReading(false);
    }
  };

  const retake = () => {
    setShot(null);
    setWords([]);
    closeSheet();
  };

  const closeSheet = () => {
    setPicked(undefined);
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
    if (!book || !picked?.trim() || !page || busy) return;
    try {
      const view = await createAsk.mutateAsync({
        bookId: book.id,
        text: picked.trim(),
        page,
      });
      recordPage();
      /**
       * 답이 왔으면 그 문장 화면에서 뜻을 편 채로 연다. 못 받았으면(질문 소진·
       * 연결 실패) 문장은 담겼고 답을 기다리는 줄에 선다 — 그 목록으로 간다.
       */
      if (view.ask.status === 'answered' && view.sentence) {
        router.replace({
          pathname: '/sentence/[id]',
          params: { id: view.sentence._id, reveal: '1' },
        });
      } else {
        router.replace('/pending');
      }
    } catch (error) {
      Alert.alert('묻지 못했어요', error instanceof Error ? error.message : '');
    }
  };

  /** 뜻은 몰라도 되고 그냥 좋았던 문장 — 질문 횟수를 쓰지 않는다 */
  const keepOnly = async () => {
    if (!book || !picked?.trim() || !page || busy) return;
    try {
      await keepSentence.mutateAsync({
        bookId: book.id,
        text: picked.trim(),
        page,
      });
      recordPage();
      router.replace({
        pathname: '/book/[id]',
        params: { id: book.id, tab: 'liked' },
      });
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
        <ScreenHeader
          leading="close"
          onLeadingPress={() => router.back()}
          title="페이지 촬영"
        />

        <View style={styles.viewfinder}>
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
          {reading ? (
            <View style={styles.reading}>
              <ActivityIndicator color={color.text.onInk} />
              <AppText style={styles.readingLabel}>
                글자를 읽는 중이에요…
              </AppText>
            </View>
          ) : null}
        </View>

        <View
          style={[styles.shutterRow, { paddingBottom: insets.bottom + 16 }]}
        >
          <Tap
            style={styles.shutter}
            onPress={shoot}
            disabled={reading}
            accessibilityRole="button"
            accessibilityLabel="찍기"
          >
            <View style={styles.shutterCore} />
          </Tap>
        </View>
      </View>
    );
  }

  /* ── 찍은 뒤: 쪽 위에서 문장 짚기 ─────────────────────────── */
  return (
    /* 자판이 올라오면 시트가 스스로 화면 위까지 자란다(`AskSheet`) */
    <View style={styles.screen}>
      <ScreenHeader
        leading="back"
        onLeadingPress={retake}
        trailing={
          <HeaderAction
            label="다시 찍기"
            tone={color.text.meta}
            onPress={retake}
          />
        }
      />

      <View style={styles.stage}>
        <PhotoPicker
          shot={shot}
          words={words}
          selection={range}
          anchor={anchor}
          onTapWord={tapWord}
        />
      </View>

      {picked ? (
        <AskSheet
          sentence={picked}
          onChangeSentence={setPicked}
          page={pageText}
          onChangePage={setPageEdit}
          maxPage={book?.pages || undefined}
          quotaLeft={left}
          asking={createAsk.isPending}
          keeping={keepSentence.isPending}
          onAsk={ask}
          onKeepOnly={keepOnly}
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
      <ScreenHeader
        leading="close"
        onLeadingPress={onBack}
        title="페이지 촬영"
      />
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

  notice: { flex: 1, paddingHorizontal: gutter, paddingTop: 40, gap: 10 },
  noticeTitle: { ...type.heading2, color: color.text.primary, lineHeight: 30 },
  noticeBody: { ...type.label1, color: color.text.secondary, lineHeight: 23 },

  footer: { paddingHorizontal: gutter, paddingTop: 12 },
});
