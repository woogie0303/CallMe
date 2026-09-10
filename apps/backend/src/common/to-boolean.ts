import { Transform } from 'class-transformer';

/**
 * 쿼리 문자열의 참·거짓을 읽는다.
 *
 * `@Type(() => Boolean)`을 쓰면 안 된다 — `Boolean('false')`는 **true**라서
 * `?finished=false`가 조용히 참이 되고, 목록이 정반대로 돌아온다.
 * 값이 없으면 없는 채로 둔다. 그래야 '주지 않았다'와 '거짓'이 갈린다.
 */
export const ToBoolean = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  });
