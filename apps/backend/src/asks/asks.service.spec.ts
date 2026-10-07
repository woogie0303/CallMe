import { INTERRUPTED_AFTER_MS, AsksService } from './asks.service';

/** 훑는 일만 시험한다 — 다른 의존성은 쓰지 않는다 */
function build() {
  const updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });
  const service = new AsksService(
    { updateMany } as never,
    ...(Array(6).fill({}) as [never, never, never, never, never, never]),
  );
  return { service, updateMany };
}

describe('AsksService.settleInterrupted', () => {
  const readerId = '64b000000000000000000001';
  const now = new Date('2026-10-07T12:00:00Z');

  it('상태도 이유도 없이 3분 넘게 남은 질문에만 이유를 붙인다', async () => {
    const { service, updateMany } = build();
    await service.settleInterrupted(readerId, now);

    expect(updateMany).toHaveBeenCalledTimes(1);
    const [filter, update] = updateMany.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(filter).toMatchObject({
      status: 'pending',
      pendingReason: { $exists: false },
    });
    expect((filter.createdAt as { $lt: Date }).$lt).toEqual(
      new Date(now.getTime() - INTERRUPTED_AFTER_MS),
    );
    expect(update).toEqual({ pendingReason: '중간에 끊김' });
  });

  it('독자 하나의 질문만 건드린다', async () => {
    const { service, updateMany } = build();
    await service.settleInterrupted(readerId, now);
    const [filter] = updateMany.mock.calls[0] as [{ readerId: unknown }];
    expect(String(filter.readerId)).toBe(readerId);
  });
});
