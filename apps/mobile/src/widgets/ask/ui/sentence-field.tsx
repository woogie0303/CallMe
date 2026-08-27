import { StyleSheet, TextInput, View } from 'react-native';

import type { Book } from '@/entities/book/model/types';
import { BookSpine } from '@/entities/book/ui/book-spine';
import { color, family, type } from '@/shared/config';
import { AppText, CameraIcon, Tap } from '@/shared/ui';

/**
 * 물어볼 문장을 적는 곳. 책에서 온 영어라 입력창 안에서도 세리프다 —
 * 여기서 산세리프로 바뀌면 내가 쓴 말과 책의 말이 구별되지 않는다.
 */
export function SentenceField({
  value,
  onChangeText,
  book,
  page,
  editable = true,
  onChangeBook,
  onCapture,
}: {
  value: string;
  onChangeText?: (next: string) => void;
  book?: Book;
  page?: number;
  editable?: boolean;
  onChangeBook?: () => void;
  onCapture?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      {book ? (
        <View style={styles.bookRow}>
          <BookSpine book={book} width={28} height={38} radius={5} />
          <View style={styles.bookMeta}>
            <AppText numberOfLines={1} style={styles.bookTitle}>
              {book.title}
            </AppText>
            <AppText style={styles.bookWhere}>{page ? `페이지 ${page}` : '페이지 미정'}</AppText>
          </View>
          <Tap style={styles.change} onPress={onChangeBook}>
            <AppText style={styles.changeLabel}>변경</AppText>
          </Tap>
        </View>
      ) : (
        <Tap style={styles.unfiled} onPress={onChangeBook}>
          <AppText style={styles.unfiledLabel}>어느 책인지 나중에 정해도 돼요</AppText>
        </Tap>
      )}

      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          multiline
          placeholder="막힌 문장을 그대로 옮겨 적어보세요"
          placeholderTextColor={color.text.assistive}
          style={styles.input}
        />
        <Tap style={styles.camera} onPress={onCapture}>
          <CameraIcon size={19} color={color.text.onInk} />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: color.surface.alt,
  },
  bookMeta: { flex: 1, gap: 2, minWidth: 0 },
  bookTitle: { ...type.label2, fontWeight: '600', color: color.text.primary },
  bookWhere: { ...type.caption2, color: color.text.meta },
  change: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: color.fill.normal,
  },
  changeLabel: { ...type.caption2, fontWeight: '600', color: color.text.meta },
  unfiled: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: color.surface.alt,
  },
  unfiledLabel: { ...type.caption1, color: color.text.meta },

  field: {
    minHeight: 148,
    borderRadius: 20,
    backgroundColor: color.surface.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border.default,
    padding: 18,
    paddingBottom: 60,
  },
  input: {
    fontFamily: family.serif,
    fontSize: 17,
    lineHeight: 27,
    color: color.text.primary,
    textAlignVertical: 'top',
    flex: 1,
  },
  camera: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: color.surface.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
