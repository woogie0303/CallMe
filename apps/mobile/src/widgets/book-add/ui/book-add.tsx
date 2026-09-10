import { StyleSheet, TextInput, View } from 'react-native';

import { draftBook } from '@/entities/book/lib/spine';
import { BookCover } from '@/entities/book/ui/book-cover';
import { color, shadow, type } from '@/shared/config';
import { AppText } from '@/shared/ui';

export type BookDraft = {
  title: string;
  author: string;
  pages: string;
  currentPage: string;
};

/**
 * 읽고 있는 책을 손으로 들인다.
 *
 * 검색으로 찾아 주지 않는다 — 원서는 국내 서지 검색에 잘 걸리지 않고, 안 걸릴
 * 때마다 등록이 막히면 읽던 흐름이 끊긴다. 제목과 지은이만 있으면 시작할 수
 * 있고, 나머지는 나중에 채워도 된다.
 *
 * 표지는 없어도 된다. 제목에서 정한 책등 색이 그 자리를 대신하고, 앞으로 담을
 * 문장 카드들이 그 색을 물려받아 라벨 없이 출처를 말한다.
 */
export function BookAdd({
  draft,
  onChange,
}: {
  draft: BookDraft;
  onChange: (next: BookDraft) => void;
}) {
  const preview = draftBook(draft.title, draft.author, Number(draft.pages) || undefined);
  const set = (key: keyof BookDraft) => (value: string) => onChange({ ...draft, [key]: value });

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText style={styles.question}>어떤 책을 읽고 계세요?</AppText>
        <AppText style={styles.sub}>등록하면 이 책에서 모은 문장이 한곳에 쌓여요</AppText>
      </View>

      <View style={styles.row}>
        <BookCover
          book={preview}
          width={96}
          height={140}
          radius={12}
          titleSize={13}
          showAuthor
          style={shadow.cover}
        />

        <View style={styles.fields}>
          <Field label="제목" value={draft.title} onChangeText={set('title')} autoFocus />
          <Field label="지은이" value={draft.author} onChangeText={set('author')} />
        </View>
      </View>

      <View style={styles.pages}>
        <Field
          label="전체 쪽수"
          value={draft.pages}
          onChangeText={set('pages')}
          keyboard
          optional
        />
        <Field
          label="지금 몇 쪽"
          value={draft.currentPage}
          onChangeText={set('currentPage')}
          keyboard
          optional
        />
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboard,
  optional,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboard?: boolean;
  optional?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>
        {label}
        {optional ? <AppText style={styles.optional}> · 없어도 돼요</AppText> : null}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        keyboardType={keyboard ? 'number-pad' : 'default'}
        placeholderTextColor={color.text.assistive}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  head: { gap: 6 },
  question: { ...type.title3, color: color.text.primary },
  sub: { ...type.label2, color: color.text.secondary },

  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  fields: { flex: 1, gap: 14, minWidth: 0 },
  pages: { flexDirection: 'row', gap: 12 },

  field: { flex: 1, gap: 5 },
  label: { ...type.caption1, color: color.text.meta },
  optional: { ...type.caption2, color: color.text.assistive },
  /** 줄 하나로 받는다 — 상자를 두르면 폼이 화면의 주인공이 된다 */
  input: {
    ...type.body2,
    color: color.text.primary,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border.default,
  },
});
