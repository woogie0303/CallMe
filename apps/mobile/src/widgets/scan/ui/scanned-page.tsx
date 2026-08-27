import { StyleSheet, View } from 'react-native';

import { blue, color, slate, type } from '@/shared/config';
import { AppText, Quote } from '@/shared/ui';

/**
 * 찍어온 페이지를 OCR로 읽어낸 것. 문장 하나하나가 눌린다 —
 * 질문의 단위가 문장이니, 페이지에서 고르는 것도 문장이어야 한다.
 *
 * 문장을 따로 쌓지 않고 한 문단으로 흘려서 조판하는 이유는 하나다.
 * 목록처럼 보이는 순간 이게 '책의 한 쪽'이라는 감각이 사라진다.
 */
export function ScannedPage({
  sentences,
  selected,
  onSelect,
}: {
  sentences: string[];
  selected?: string;
  onSelect: (sentence: string) => void;
}) {
  return (
    <View style={styles.paper}>
      <Quote style={styles.flow}>
        {sentences.map((sentence, i) => {
          const on = sentence === selected;
          return (
            <Quote
              key={i}
              onPress={() => onSelect(sentence)}
              style={[styles.sentence, on ? styles.sentenceOn : null]}>
              {sentence}
              {i < sentences.length - 1 ? '  ' : ''}
            </Quote>
          );
        })}
      </Quote>
      <AppText style={styles.hint}>사진에서 읽어낸 글이에요 · 물어볼 문장을 눌러보세요</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    borderRadius: 16,
    backgroundColor: color.surface.page,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.default,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 16,
  },
  flow: { fontSize: 16, lineHeight: 28 },
  sentence: { color: slate(0.82) },
  sentenceOn: { color: color.primary, backgroundColor: blue(0.12), fontWeight: '600' },
  hint: { ...type.caption2, color: color.text.assistive },
});
