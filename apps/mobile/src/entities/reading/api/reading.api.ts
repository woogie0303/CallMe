import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ApiBook } from '@/shared/api/types';
import type {
  GenreShare,
  ReadingCalendarDay,
  ReadingWeek,
} from '../model/types';

type ApiGenreStat = { genre: string; pages: number };

type ApiWeek = {
  days: { date: string; pages: number }[];
  daysRead: number;
  streak: number;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 읽기 기록 전부의 머리. 진도가 바뀌면 이레·달력·장르가 한꺼번에 낡으므로
 * 무효화는 늘 이 머리로 한다 — 한동안 이레만 무효화해서 장르 화면은 새로
 * 읽은 쪽을 몰랐다.
 */
export const readingKey = ['reading'] as const;

/**
 * 이번 이레. 서버는 날짜와 쪽수만 주고, 막대를 얼마나 채울지는 여기서 정한다.
 *
 * 그 주에 가장 많이 읽은 날을 가득 찬 것으로 본다. 절대량으로 그리면 백 쪽짜리
 * 하루가 있는 주에는 나머지 엿새가 전부 바닥에 붙어, 읽은 날과 안 읽은 날이
 * 구분되지 않는다.
 */
export function useReadingWeek() {
  return useQuery({
    queryKey: [...readingKey, 'week'],
    queryFn: async (): Promise<ReadingWeek> => {
      const week = await api<ApiWeek>('/reading/week');
      const most = Math.max(1, ...week.days.map((day) => day.pages));
      const total = week.days.reduce((sum, day) => sum + day.pages, 0);
      const monthLabel = `${new Date().getMonth() + 1}월`;
      const today = new Date().toDateString();

      return {
        monthLabel,
        days: week.daysRead,
        pages: total,
        streak: week.streak,
        bars: week.days.map((day) => {
          const date = new Date(day.date);
          const isToday = date.toDateString() === today;
          return {
            label: isToday ? '오늘' : WEEKDAYS[date.getDay()],
            amount: day.pages / most,
            pages: day.pages,
            today: isToday,
          };
        }),
      };
    },
  });
}

/**
 * 지금까지 읽은 쪽수를 장르로 묶은 것. 이번 주 막대와 달리 **전 기록**을
 * 본다 — 장르 취향은 하루이틀로는 안 보이고, 오래 쌓여야 뜻이 생긴다.
 *
 * '장르 없음'은 맨 뒤로 보낸다 — 옛 책이나 카카오·Open Library로 등록해
 * 장르를 못 채운 책들이 실제로 좋아하는 장르보다 크게 보이면 안 된다.
 */
export function useGenreStats() {
  return useQuery({
    queryKey: [...readingKey, 'genres'],
    queryFn: async (): Promise<GenreShare[]> => {
      const rows = await api<ApiGenreStat[]>('/reading/genres');
      const total = rows.reduce((sum, row) => sum + row.pages, 0);
      const [known, unknown] = partition(
        rows,
        (row) => row.genre !== '장르 없음',
      );
      return [...known, ...unknown].map((row) => ({
        genre: row.genre,
        pages: row.pages,
        ratio: total > 0 ? row.pages / total : 0,
      }));
    },
  });
}

function partition<T>(items: T[], test: (item: T) => boolean): [T[], T[]] {
  const yes: T[] = [];
  const no: T[] = [];
  for (const item of items) (test(item) ? yes : no).push(item);
  return [yes, no];
}

/**
 * 달력이 오갈 수 있는 달 — 가입한 달부터 이번 달(또는 마지막 기록이 있는 달)까지.
 * 둘 다 `{ year, month }`(month는 1~12).
 */
export function useReadingRange() {
  return useQuery({
    queryKey: [...readingKey, 'range'],
    queryFn: async () => {
      const range = await api<{ first: string; last: string }>(
        '/reading/range',
      );
      const first = new Date(range.first);
      const last = new Date(range.last);
      return {
        first: { year: first.getFullYear(), month: first.getMonth() + 1 },
        last: { year: last.getFullYear(), month: last.getMonth() + 1 },
      };
    },
  });
}

/**
 * 그 달 1일부터 마지막 날까지의 날짜와 쪽수 — 읽은 날 모눈이 쓴다.
 * `month`는 1~12(자바스크립트 Date와 달리 0부터 세지 않는다).
 */
export function useReadingMonth(year: number, month: number) {
  return useQuery({
    queryKey: [...readingKey, 'days', year, month],
    queryFn: async (): Promise<ReadingCalendarDay[]> => {
      const rows = await api<{ date: string; pages: number }[]>(
        `/reading/days?year=${year}&month=${month}`,
      );
      return rows.map((row) => ({
        date: new Date(row.date),
        pages: row.pages,
      }));
    },
  });
}

/** 읽은 데까지 표시를 옮긴다 — 그 차이가 곧 오늘 읽은 양이 된다 */
export function useUpdateProgress(bookId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (currentPage: number) =>
      api<ApiBook>(`/books/${bookId}`, {
        method: 'PATCH',
        body: { currentPage },
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['books'] });
      client.invalidateQueries({ queryKey: readingKey });
    },
  });
}
