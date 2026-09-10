import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiBook } from '@/shared/api/types';
import type { ReadingWeek } from '../model/mock';

type ApiWeek = {
  days: { date: string; pages: number }[];
  daysRead: number;
  streak: number;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const readingKey = ['reading', 'week'] as const;

/**
 * 이번 이레. 서버는 날짜와 쪽수만 주고, 막대를 얼마나 채울지는 여기서 정한다.
 *
 * 그 주에 가장 많이 읽은 날을 가득 찬 것으로 본다. 절대량으로 그리면 백 쪽짜리
 * 하루가 있는 주에는 나머지 엿새가 전부 바닥에 붙어, 읽은 날과 안 읽은 날이
 * 구분되지 않는다.
 */
export function useReadingWeek() {
  return useQuery({
    queryKey: readingKey,
    queryFn: async (): Promise<ReadingWeek> => {
      const week = await api<ApiWeek>('/reading/week');
      const most = Math.max(1, ...week.days.map((day) => day.pages));
      const today = new Date().toDateString();

      return {
        monthLabel: `${new Date().getMonth() + 1}월`,
        days: week.daysRead,
        streak: week.streak,
        bars: week.days.map((day) => {
          const date = new Date(day.date);
          const isToday = date.toDateString() === today;
          return {
            label: isToday ? '오늘' : WEEKDAYS[date.getDay()],
            amount: day.pages / most,
            today: isToday,
          };
        }),
      };
    },
  });
}

/** 읽은 데까지 표시를 옮긴다 — 그 차이가 곧 오늘 읽은 양이 된다 */
export function useUpdateProgress(bookId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (currentPage: number) =>
      api<ApiBook>(`/books/${bookId}`, { method: 'PATCH', body: { currentPage } }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['books'] });
      client.invalidateQueries({ queryKey: readingKey });
    },
  });
}
