import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ReaderView } from '@/shared/api/types';

export const readerKey = ['reader', 'me'] as const;

export function useReader() {
  return useQuery({
    queryKey: readerKey,
    queryFn: () => api<ReaderView>('/readers/me'),
  });
}
