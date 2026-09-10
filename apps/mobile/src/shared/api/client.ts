import Constants from 'expo-constants';
import { clearTokens, readTokens, saveTokens } from './tokens';
import type { Tokens } from './types';

/**
 * 개발 중에는 시뮬레이터가 아니라 실제 기기에서도 열려야 하므로, 호스트를
 * Expo가 알려주는 개발 서버 주소에서 가져온다. 배포에서는 EXPO_PUBLIC_API_URL을 쓴다.
 */
function baseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:4000/api` : 'http://localhost:4000/api';
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** 로그인이 끊겼다는 신호. 세션이 이걸 받아 로그인 화면으로 되돌린다. */
export class Unauthenticated extends ApiError {
  constructor() {
    super(401, '다시 로그인해 주세요.');
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** 로그인 전에 부르는 길 — 토큰을 붙이지 않는다 */
  anonymous?: boolean;
};

let refreshing: Promise<string | null> | null = null;

/**
 * 액세스 토큰이 만료되면 한 번만 새로 받아 같은 요청을 다시 보낸다.
 *
 * 새로 받는 일은 한 번에 하나만 돈다. 화면 넷이 동시에 401을 받으면 재발급도
 * 네 번 도는데, 리프레시는 쓰면 폐기되는 일회용이라 나머지 셋이 이미 죽은
 * 토큰으로 요청하게 되고 그 순간 로그아웃된다.
 */
async function refresh(): Promise<string | null> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const stored = await readTokens();
    if (!stored) return null;

    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refresh }),
    });

    if (!response.ok) {
      await clearTokens();
      return null;
    }

    const tokens = (await response.json()) as Tokens;
    await saveTokens(tokens);
    return tokens.accessToken;
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const send = async (token?: string | null): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${baseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  };

  const stored = options.anonymous ? null : await readTokens();
  let response = await send(stored?.access);

  if (response.status === 401 && !options.anonymous) {
    const renewed = await refresh();
    if (!renewed) throw new Unauthenticated();
    response = await send(renewed);
  }

  if (response.status === 401) throw new Unauthenticated();

  if (!response.ok) {
    throw new ApiError(response.status, await readMessage(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** 서버는 실패할 때도 사람에게 보여줄 한국어 문장을 준다 — 그걸 그대로 쓴다 */
async function readMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join('\n');
    if (body.message) return body.message;
  } catch {
    /* 본문이 JSON이 아닐 수도 있다 */
  }
  return '잠시 후 다시 시도해 주세요.';
}
