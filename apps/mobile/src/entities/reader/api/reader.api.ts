import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { Level, ReaderView } from '@/shared/api/types';

export const readerKey = ['reader', 'me'] as const;

export function useReader() {
  return useQuery({
    queryKey: readerKey,
    queryFn: () => api<ReaderView>('/readers/me'),
  });
}

export function useUpdateReader() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { level?: Level; nickname?: string }) =>
      api<ReaderView>('/readers/me', { method: 'PATCH', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: readerKey }),
  });
}
