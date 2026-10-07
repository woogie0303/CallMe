import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import type { ApiThought } from '@/shared/api/types';
import { color, type } from '@/shared/config';
import { agoLabel } from '@/shared/lib/date';
import { AppText, Icon, MoreIcon, Tap } from '@/shared/ui';

/**
 * 이 문장에 대고 남긴 내 생각 — 스레드처럼 아래로 쌓인다.
 *
 * 챕터를 통째로 옮겨 적던 리텔링 대신 들어왔다. 쓰는 부담이 한 줄이면 족하고,
 * 무엇에 대한 생각인지(이 문장) 늘 위에 붙어 있다. 같은 문장을 다시 펼 때마다
 * 그때의 생각을 하나씩 더 달 수 있어서, 시간이 지나 이 문장이 다르게 읽히면
 * 그 변화가 줄로 남는다 — 이 앱이 하려는 '예전의 나와 다시 만나기'가 여기서도 된다.
 *
 * 모양은 스레드(Threads) 글타래를 따른다: 왼쪽에 얼굴, 얼굴끼리 잇는 세로선,
 * 이름·시각, 그 아래 글. 앱이 하는 말이 아니라 **내가 쓴 말**이라 산세리프다
 * (세리프는 책에서 온 영어에만).
 */
export function ThoughtThread({
  thoughts,
  nickname,
  avatar,
  onRemove,
}: {
  thoughts: ApiThought[];
  nickname: string;
  avatar?: string;
  onRemove: (thoughtId: string) => void;
}) {
  if (!thoughts.length) return null;

  return (
    <View style={styles.thread}>
      {thoughts.map((thought, i) => {
        const last = i === thoughts.length - 1;
        return (
          <View key={thought._id} style={styles.post}>
            <View style={styles.rail}>
              <Avatar nickname={nickname} uri={avatar} />
              {/* 다음 생각으로 잇는 선 — 마지막 줄에는 없다 */}
              {last ? null : <View style={styles.line} />}
            </View>

            <View style={[styles.body, last ? null : styles.bodyGap]}>
              <View style={styles.head}>
                <AppText numberOfLines={1} style={styles.name}>
                  {nickname}
                </AppText>
                <AppText style={styles.time}>
                  {agoLabel(thought.createdAt)}
                </AppText>
                <View style={styles.spacer} />
                <Tap
                  hitSlop={10}
                  onPress={() => onRemove(thought._id)}
                  accessibilityRole="button"
                  accessibilityLabel="이 생각 지우기"
                >
                  <View style={styles.dots}>
                    <MoreIcon size={16} color={color.text.meta} />
                  </View>
                </Tap>
              </View>
              <AppText style={styles.text}>{thought.text}</AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * 맨 아래 붙는 쓰기 칸 — 스레드의 '답글 달기' 자리.
 * 보내면 비워지고, 쓰는 동안은 보내기가 도는 표시로 바뀐다(두 번 눌리지 않게).
 */
export function ThoughtInput({
  onSend,
  sending,
  nickname,
  avatar,
}: {
  onSend: (text: string) => Promise<void>;
  sending?: boolean;
  nickname: string;
  avatar?: string;
}) {
  const [text, setText] = useState('');
  const ready = text.trim().length > 0 && !sending;

  const send = async () => {
    if (!ready) return;
    try {
      await onSend(text.trim());
      setText('');
    } catch {
      /** 실패하면 쓴 글을 그대로 둔다 — 다시 보내면 된다. 알리는 일은 부르는 쪽이 한다. */
    }
  };

  return (
    <View style={styles.bar}>
      <Avatar nickname={nickname} uri={avatar} size={30} />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="이 문장에 대한 생각을 남겨요"
        placeholderTextColor={color.text.assistive}
        multiline
        maxLength={1000}
        style={styles.input}
        accessibilityLabel="이 문장에 대한 생각"
      />
      <Tap
        onPress={send}
        disabled={!ready}
        hitSlop={8}
        style={styles.send}
        accessibilityRole="button"
        accessibilityLabel="생각 남기기"
      >
        {sending ? (
          <ActivityIndicator size="small" color={color.text.meta} />
        ) : (
          <Icon
            name="send"
            size={18}
            color={ready ? color.primary : color.fill.bold}
          />
        )}
      </Tap>
    </View>
  );
}

/** 얼굴 — 로그인한 곳의 사진이 있으면 그걸, 없으면 닉네임 첫 글자 */
function Avatar({
  nickname,
  uri,
  size = 34,
}: {
  nickname: string;
  uri?: string;
  size?: number;
}) {
  const frame = { width: size, height: size, borderRadius: size / 2 };
  return uri ? (
    <Image source={{ uri }} style={[styles.avatar, frame]} contentFit="cover" />
  ) : (
    <View style={[styles.avatar, styles.avatarBlank, frame]}>
      <AppText style={styles.initial}>{nickname.slice(0, 1)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  thread: { gap: 0 },
  post: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 34 },
  /** 얼굴과 얼굴 사이를 잇는 선 — 스레드에서 '이어지는 글'이라는 표시다 */
  line: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    marginVertical: 6,
    backgroundColor: color.border.default,
  },
  body: { flex: 1, minWidth: 0, gap: 4 },
  bodyGap: { paddingBottom: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    ...type.label1,
    fontWeight: '700',
    color: color.text.primary,
    flexShrink: 1,
  },
  time: { ...type.label2, color: color.text.meta },
  spacer: { flex: 1 },
  /** 세로 점 셋을 눕혀 가로(⋯)로 — 스레드 글의 더 보기와 같은 모양 */
  dots: { transform: [{ rotate: '90deg' }] },
  text: { ...type.body2, lineHeight: 23, color: color.text.body },

  avatar: { backgroundColor: color.fill.default },
  avatarBlank: { alignItems: 'center', justifyContent: 'center' },
  initial: { ...type.label2, fontWeight: '700', color: color.text.secondary },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: color.surface.alt,
  },
  input: {
    flex: 1,
    ...type.body2,
    color: color.text.primary,
    maxHeight: 110,
    paddingVertical: 4,
  },
  send: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
