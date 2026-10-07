import { Types } from 'mongoose';
import { ReadingService } from './reading.service';

type Row = { _id: string; day: Date; pages: number };

/** 한 책의 읽은 기록만 흉내 내는 가짜 모델 — 덜어낸 결과가 줄마다 어떻게 남는지만 본다 */
function build(rows: Row[]) {
  const state = rows.map((row) => ({ ...row }));
  const logs = {
    find: jest.fn(() => ({
      sort: () => ({
        lean: () =>
          Promise.resolve(
            state
              .filter((row) => row.pages > 0)
              .sort((a, b) => b.day.getTime() - a.day.getTime())
              .map((row) => ({ ...row })),
          ),
      }),
    })),
    deleteOne: jest.fn(({ _id }: { _id: string }) => {
      state.splice(
        state.findIndex((row) => row._id === _id),
        1,
      );
      return Promise.resolve();
    }),
    updateOne: jest.fn(
      (
        filter: { _id?: string },
        update: { $inc: { pages: number } },
        options?: { upsert?: boolean },
      ) => {
        const row = state.find((r) => r._id === filter._id);
        if (row) row.pages += update.$inc.pages;
        else if (options?.upsert)
          state.push({
            _id: 'new',
            day: new Date(),
            pages: update.$inc.pages,
          });
        return Promise.resolve();
      },
    ),
  };
  const service = new ReadingService(logs as never, {} as never, {} as never);
  return { service, state, logs };
}

const day = (daysAgo: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
};
const reader = new Types.ObjectId().toString();
const book = new Types.ObjectId().toString();

describe('ReadingService.record', () => {
  it('앞으로 가면 오늘 줄에 더한다', async () => {
    const { service, state } = build([]);
    await service.record(reader, book, 20);
    expect(state.map((r) => r.pages)).toEqual([20]);
  });

  it('쪽수를 잘못 적었다가 줄이면 그만큼 덜어낸다 (67 → 30)', async () => {
    const { service, state } = build([{ _id: 'a', day: day(0), pages: 67 }]);
    await service.record(reader, book, 30 - 67);
    expect(state.map((r) => r.pages)).toEqual([30]);
  });

  it('오늘 기록이 모자라면 가장 최근 전날로 거슬러 덜어낸다', async () => {
    const { service, state } = build([
      { _id: 'old', day: day(2), pages: 40 },
      { _id: 'yesterday', day: day(1), pages: 15 },
      { _id: 'today', day: day(0), pages: 10 },
    ]);
    await service.record(reader, book, -30);
    /** 오늘 10 전부 + 어제 15 전부 + 그제 5 */
    expect(state.map((r) => [r._id, r.pages])).toEqual([['old', 35]]);
  });

  it('기록한 것보다 많이 덜어내도 0에서 멈추고 음수를 만들지 않는다', async () => {
    const { service, state } = build([{ _id: 'a', day: day(0), pages: 10 }]);
    await service.record(reader, book, -50);
    expect(state).toEqual([]);
  });

  it('0이면 아무것도 하지 않는다', async () => {
    const { service, logs } = build([{ _id: 'a', day: day(0), pages: 10 }]);
    await service.record(reader, book, 0);
    expect(logs.updateOne).not.toHaveBeenCalled();
    expect(logs.deleteOne).not.toHaveBeenCalled();
  });
});
