import { BadGatewayException, UnauthorizedException } from '@nestjs/common';

/**
 * 제공자와 주고받는 두 번의 통신. 실패를 그대로 흘려보내지 않고 여기서
 * 갈라 놓는다 — 코드가 틀린 것(독자 잘못, 401)과 제공자가 답하지 않는 것
 * (우리 쪽에서 할 수 있는 게 없음, 502)은 앱이 다르게 말해야 한다.
 */
export async function postForm<T>(
  provider: string,
  url: string,
  body: Record<string, string | undefined>,
): Promise<T> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) form.set(key, value);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: form,
  });

  return read<T>(provider, response);
}

export async function getJson<T>(
  provider: string,
  url: string,
  accessToken: string,
): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return read<T>(provider, response);
}

async function read<T>(provider: string, response: Response): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      throw new UnauthorizedException(`${provider} 로그인에 실패했어요. 다시 시도해 주세요.`);
    }
    throw new BadGatewayException(`${provider}가 응답하지 않아요: ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new BadGatewayException(`${provider}의 응답을 읽지 못했어요.`);
  }
}
