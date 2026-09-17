import { StyleSheet, TextInput, View } from 'react-native';

import { color, family } from '@/shared/config';
import { CameraIcon, Tap } from '@/shared/ui';

/**
 * 물어볼 문장을 적는 곳. 책에서 온 영어라 입력창 안에서도 세리프다 —
 * 여기서 산세리프로 바뀌면 내가 쓴 말과 책의 말이 구별되지 않는다.
 */
export function SentenceField({
  value,
  onChangeText,
  onCapture,
}: {
  value: string;
  onChangeText?: (next: string) => void;
  onCapture?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline
          placeholder="막힌 문장을 그대로 옮겨 적어보세요"
          placeholderTextColor={color.text.assistive}
          style={styles.input}
        />
        <Tap
          style={styles.camera}
          onPress={onCapture}
          accessibilityRole="button"
          accessibilityLabel="읽던 쪽 촬영">
          <CameraIcon size={19} color={color.text.onInk} />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },

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
