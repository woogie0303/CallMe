import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AccountDeletionService } from './account-deletion.service';

/** 호출 순서를 남기는 가짜 모델 — deleteMany/deleteOne이 무엇으로 불렸는지만 본다 */
function fakeModel(name: string, calls: string[], failWith?: Error) {
  const record = (op: string) =>
    jest.fn((filter: object) => {
      calls.push(`${name}.${op}`);
      if (failWith) return Promise.reject(failWith);
      return Promise.resolve({ filter });
    });
  return { deleteMany: record('deleteMany'), deleteOne: record('deleteOne') };
}

function build(
  options: {
    failing?: string;
    apple?: { enabled: boolean; revoke?: jest.Mock; refreshToken?: string };
  } = {},
) {
  const calls: string[] = [];
  const err = new Error('몽고가 끊겼어요');
  const make = (name: string) =>
    fakeModel(name, calls, options.failing === name ? err : undefined);

  const models = {
    books: make('books'),
    sentences: make('sentences'),
    items: make('items'),
    asks: make('asks'),
    retells: make('retells'),
    logs: make('logs'),
    refreshTokens: make('refreshTokens'),
    tickets: make('tickets'),
    readers: make('readers'),
  };

  const apple = {
    enabled: jest.fn(() => options.apple?.enabled ?? false),
    revoke: options.apple?.revoke ?? jest.fn().mockResolvedValue(undefined),
  };
  (models.readers as Record<string, unknown>).findById = jest.fn(() =>
    Promise.resolve(
      options.apple?.refreshToken
        ? {
            accounts: [
              { provider: 'apple', refreshToken: options.apple.refreshToken },
              { provider: 'kakao' },
            ],
          }
        : null,
    ),
  );

  const service = new AccountDeletionService(
    models.books as never,
    models.sentences as never,
    models.items as never,
    models.asks as never,
    models.retells as never,
    models.logs as never,
    models.refreshTokens as never,
    models.tickets as never,
    models.readers as never,
    apple as never,
  );
  return { service, models, calls, err, apple };
}

describe('AccountDeletionService', () => {
  const readerId = new Types.ObjectId().toString();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterAll(() => jest.restoreAllMocks());

  it('독자가 맡긴 컬렉션을 전부, 그 독자의 것만 지운다', async () => {
    const { service, models } = build();
    await service.remove(readerId);

    const owned = [
      models.books,
      models.sentences,
      models.items,
      models.asks,
      models.retells,
      models.logs,
      models.refreshTokens,
      models.tickets,
    ];
    for (const model of owned) {
      expect(model.deleteMany).toHaveBeenCalledTimes(1);
      const [filter] = model.deleteMany.mock.calls[0] as unknown as [
        { readerId: Types.ObjectId },
      ];
      /** 필터가 이 독자 하나로 좁혀져 있어야 한다 — 비면 컬렉션을 통째로 지운다 */
      expect(Object.keys(filter)).toEqual(['readerId']);
      expect(filter.readerId.toString()).toBe(readerId);
    }
  });

  it('독자 문서는 나머지가 다 끝난 뒤 맨 마지막에 지운다', async () => {
    const { service, models, calls } = build();
    await service.remove(readerId);

    expect(calls[calls.length - 1]).toBe('readers.deleteOne');
    expect(calls.filter((c) => c === 'readers.deleteOne')).toHaveLength(1);
    const [filter] = models.readers.deleteOne.mock.calls[0] as unknown as [
      { _id: Types.ObjectId },
    ];
    expect(filter._id.toString()).toBe(readerId);
  });

  it('중간에 하나라도 실패하면 독자를 남겨둔다 — 다시 시도할 수 있게', async () => {
    const { service, models, err } = build({ failing: 'sentences' });

    await expect(service.remove(readerId)).rejects.toBe(err);
    expect(models.readers.deleteOne).not.toHaveBeenCalled();
  });

  it('두 번 불러도 같다 — 이미 지워진 것을 또 지워도 아무 일이 아니다', async () => {
    const { service, models } = build();
    await service.remove(readerId);
    await expect(service.remove(readerId)).resolves.toBeUndefined();
    expect(models.readers.deleteOne).toHaveBeenCalledTimes(2);
  });

  it('Apple로 로그인한 독자면 그 refresh token을 Apple에 회수한다', async () => {
    const { service, apple } = build({
      apple: { enabled: true, refreshToken: 'r-token' },
    });
    await service.remove(readerId);
    expect(apple.revoke).toHaveBeenCalledTimes(1);
    expect(apple.revoke).toHaveBeenCalledWith('r-token');
  });

  it('Apple 회수가 실패해도 삭제는 끝까지 한다', async () => {
    const revoke = jest.fn().mockRejectedValue(new Error('Apple이 죽었어요'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { service, models } = build({
      apple: { enabled: true, revoke, refreshToken: 'r-token' },
    });
    await expect(service.remove(readerId)).resolves.toBeUndefined();
    expect(revoke).toHaveBeenCalled();
    expect(models.readers.deleteOne).toHaveBeenCalledTimes(1);
  });

  it('Apple 키가 없으면 Apple에 아무것도 묻지 않는다', async () => {
    const { service, apple } = build({
      apple: { enabled: false, refreshToken: 'r-token' },
    });
    await service.remove(readerId);
    expect(apple.revoke).not.toHaveBeenCalled();
  });
});
