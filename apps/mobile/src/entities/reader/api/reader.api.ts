import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ReaderView } from '@/shared/api/types';

export const readerKey = ['reader', 'me'] as const;

export function useReader() {
  return useQuery({
    queryKey: readerKey,
    queryFn: () => api<ReaderView>('/readers/me'),
  });
}

/**
 * 계정 삭제 — 서버가 책·문장·표현·질문·읽은 기록·토큰을 전부 지운다. 되돌릴 수 없다.
 * 끝난 뒤의 정리(기기의 토큰·캐시·알림 예약 지우기, 로그인 화면으로 보내기)는
 * 화면이 `signOut`으로 한다 — 서버에 이미 없는 계정이라 로그아웃 호출은 실패해도
 * 기기에서는 지워진다.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api<void>('/readers/me', { method: 'DELETE' }),
  });
}
