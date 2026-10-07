import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './jwt-auth.guard';

/** 가드가 확인해 둔 독자 id. 가드 없이 쓰면 빈 문자열이 오므로 늘 함께 쓴다. */
export const CurrentReader = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    return request.readerId ?? '';
  },
);
