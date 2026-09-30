import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Genre } from './book.schema';

export type BookSearchResult = {
  title: string;
  author: string;
  pages?: number;
  cover?: string;
  publisher?: string;
  /** 자동으로 알아낸 장르 — 구글 북스에서만 온다. 없으면 등록 화면에서 고른다. */
  genre?: Genre;
};

/**
 * 구글 북스의 BISAC 계열 분류(`volumeInfo.categories`, 예: 'Fiction / Literary',
 * 'Juvenile Fiction / Fantasy & Magic')를 우리 장르 목록으로 접는다. 구글은 한
 * 책에 여러 줄을 주기도 하는데, 뒤로 갈수록 세분류라 **첫 줄의 첫 낱말**이 가장
 * 굵은 갈래다.
 *
 * 표에 없는 분류는 매핑하지 않고 그대로 비워 등록 화면에서 고르게 한다 — 억지로
 * '기타'에 몰아넣으면 실제로 '기타'를 고른 책과 구분이 안 된다.
 */
const CATEGORY_MAP: [RegExp, Genre][] = [
  [/juvenile|young adult|children/i, '청소년·아동'],
  [/science fiction|fantasy/i, '판타지·SF'],
  [/mystery|thriller|suspense|crime/i, '미스터리·스릴러'],
  [/romance/i, '로맨스'],
  [/drama/i, '희곡'],
  [/poetry/i, '시'],
  [/literary collections|essays/i, '에세이'],
  [/biography|autobiography/i, '전기·자서전'],
  [/philosophy/i, '인문·철학'],
  [/history/i, '역사'],
  [/business|economics/i, '경제·경영'],
  [/self-help/i, '자기계발'],
  [/social science|psychology/i, '사회과학'],
  [/science|nature|technology|medical/i, '과학'],
  [/art|music|performing arts|photography/i, '예술'],
  [/fiction/i, '소설'],
];

function genreFromGoogleCategories(categories?: string[]): Genre | undefined {
  const first = categories?.[0];
  if (!first) return undefined;
  for (const [pattern, genre] of CATEGORY_MAP) {
    if (pattern.test(first)) return genre;
  }
  return undefined;
}

/** 한 곳이 답하지 못했다 — 다음 곳으로 넘어갈 신호 */
class SourceFailed extends Error {}

type Source = { name: string; run: () => Promise<BookSearchResult[]> };

const HANGUL = /[ㄱ-ㆎ가-힣]/;

/** 같은 검색어를 10분 동안은 다시 밖으로 묻지 않는다 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

/**
 * 책을 찾아준다. 독자는 모국어 책도, 다른 나라 원서도 읽는다 — **검색어의 언어가 곧
 * 찾는 책의 언어**라고 보고 찾을 곳을 고른다.
 *
 * - **한글이 들어 있으면 카카오 책 검색.** 한국 책은 여기가 압도적이다(「채식주의자」
 *   45건 대 Open Library 1건).
 * - **그 밖의 모든 언어는 Open Library.** 원서를 원서 그대로 찾는다. 카카오로 원서
 *   제목을 찾으면 번역판이 먼저 뜬다 — 「Klara and the Sun」을 치면 「클라라와 태양」이,
 *   「ノルウェイの森」를 치면 「상실의 시대」가 1위다. 원서를 찾는 사람에게 틀린 답이다.
 *
 * 그래서 두 곳의 결과를 **섞지 않는다.** 섞으면 원서를 찾는 사람 앞에 번역판이 끼어든다.
 *
 * 앞의 곳이 막히면 다음 곳으로 넘어간다. `GOOGLE_BOOKS_API_KEY`가 있으면 한글이 아닌
 * 검색에서 구글을 먼저 부른다 — 키 없는 구글 요청은 쿼터를 같은 네트워크와 나눠 써서
 * 거의 늘 429라 부르지 않는다. 모두 막히면 빈 목록이 아니라 **오류**를 준다. 빈 목록은
 * 앱이 "찾는 책이 없어요"라고 말하게 해서, 막힌 것을 독자 탓으로 돌린다.
 *
 * Open Library는 **서버 전체에 초당 1건**(연락처를 밝히면 3건)이 한도다 — 사용자마다가
 * 아니다. 그래서 같은 검색어는 잠시 캐시하고, 앱은 입력이 멈춘 뒤에만 묻는다.
 */
@Injectable()
export class BookSearchService {
  private readonly log = new Logger(BookSearchService.name);
  private readonly cache = new Map<
    string,
    { at: number; results: BookSearchResult[] }
  >();

  constructor(private readonly config: ConfigService) {}

  async search(query: string): Promise<BookSearchResult[]> {
    const q = query.trim();
    const key = q.toLowerCase();

    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.results;

    for (const source of this.sourcesFor(q)) {
      try {
        const results = dedupe(await source.run());
        this.remember(key, results);
        return results;
      } catch (error) {
        this.log.warn(
          `${source.name}이(가) 답하지 않아 다음 곳으로 넘어가요: ${String(error)}`,
        );
      }
    }

    throw new ServiceUnavailableException(
      '책 검색이 잠시 막혔어요. 직접 입력해 주세요.',
    );
  }

  /** 검색어 언어에 맞는 곳부터. 키가 없는 곳은 아예 넣지 않는다. */
  private sourcesFor(q: string): Source[] {
    const kakaoKey = this.config.get<string>('KAKAO_CLIENT_ID');
    const googleKey = this.config.get<string>('GOOGLE_BOOKS_API_KEY');

    const kakao: Source | null = kakaoKey
      ? { name: '카카오 책 검색', run: () => this.kakao(q, kakaoKey) }
      : null;
    const google: Source | null = googleKey
      ? { name: '구글 북스', run: () => this.google(q, googleKey) }
      : null;
    const openLibrary: Source = {
      name: 'Open Library',
      run: () => this.openLibrary(q),
    };

    const order = HANGUL.test(q) ? [kakao, openLibrary] : [google, openLibrary];
    return order.filter((source): source is Source => source !== null);
  }

  private remember(key: string, results: BookSearchResult[]) {
    /** Map은 넣은 순서를 지킨다 — 가장 먼저 넣은 것부터 버린다 */
    if (this.cache.size >= CACHE_MAX) {
      const [oldest] = this.cache.keys();
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { at: Date.now(), results });
  }

  /**
   * 카카오(다음) 책 검색. 카카오 로그인에 쓰는 REST API 키(`KAKAO_CLIENT_ID`)를 그대로
   * 쓴다 — 같은 앱의 키라 따로 발급받을 게 없다. 무료, 하루 3만 건.
   */
  private async kakao(q: string, key: string): Promise<BookSearchResult[]> {
    const url = new URL('https://dapi.kakao.com/v3/search/book');
    url.searchParams.set('query', q);
    url.searchParams.set('size', '20');

    const body = await fetchJson<KakaoResponse>(url, 'Kakao', {
      Authorization: `KakaoAK ${key}`,
    });
    return (body.documents ?? []).map(fromKakao).filter(isResult);
  }

  private async google(q: string, key: string): Promise<BookSearchResult[]> {
    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.searchParams.set('q', q);
    url.searchParams.set('maxResults', '20');
    url.searchParams.set('key', key);

    const body = await fetchJson<GoogleBooksResponse>(url, 'Google Books');
    return (body.items ?? []).map(fromGoogle).filter(isResult);
  }

  private async openLibrary(q: string): Promise<BookSearchResult[]> {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '20');
    /** 필요한 필드만 — 전부 받으면 한 권에 수십 개 필드가 딸려 와서 느리다 */
    url.searchParams.set(
      'fields',
      'title,author_name,number_of_pages_median,cover_i,publisher',
    );

    /**
     * Open Library는 누가 부르는지 밝히라고 한다. 연락처 메일까지 밝히면 한도가 초당
     * 1건에서 3건으로 오른다. 메일은 외부로 나가는 값이라 설정으로만 받는다.
     */
    const contact = this.config.get<string>('OPEN_LIBRARY_CONTACT');
    const agent = contact ? `Reread/1.0 (${contact})` : 'Reread/1.0';

    const body = await fetchJson<OpenLibraryResponse>(url, 'Open Library', {
      'User-Agent': agent,
    });
    return (body.docs ?? []).map(fromOpenLibrary).filter(isResult);
  }
}

/** 응답하지 않거나 2xx가 아니면 SourceFailed — 다음 곳으로 넘어가게 */
async function fetchJson<T>(
  url: URL,
  name: string,
  headers?: Record<string, string>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  } catch (error) {
    throw new SourceFailed(`${name} 연결 실패: ${String(error)}`);
  }
  if (!response.ok) throw new SourceFailed(`${name} ${response.status}`);
  return (await response.json()) as T;
}

const isResult = (book: BookSearchResult | null): book is BookSearchResult =>
  book !== null;

/**
 * 판만 다르고 보이는 것은 똑같은 줄을 하나로. 카카오는 같은 제목·지은이·출판사를
 * ISBN만 달리해서 여러 번 준다 — 목록에 같은 줄이 반복되면 무엇을 골라야 할지 모른다.
 */
function dedupe(results: BookSearchResult[]): BookSearchResult[] {
  const seen = new Set<string>();
  return results.filter((book) => {
    const id =
      `${book.title}|${book.author}|${book.publisher ?? ''}`.toLowerCase();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

type KakaoResponse = { documents?: KakaoDocument[] };
type KakaoDocument = {
  title?: string;
  authors?: string[];
  publisher?: string;
  /** 표지가 없으면 빈 문자열로 온다 */
  thumbnail?: string;
};

/** 카카오는 쪽수를 주지 않는다 — 책 추가 화면에서 직접 넣는다 */
function fromKakao(doc: KakaoDocument): BookSearchResult | null {
  if (!doc.title) return null;

  return {
    title: doc.title,
    author: doc.authors?.length ? doc.authors.join(', ') : '지은이 미상',
    cover: doc.thumbnail || undefined,
    publisher: doc.publisher || undefined,
  };
}

type GoogleBooksResponse = { items?: GoogleVolume[] };
type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    pageCount?: number;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    categories?: string[];
  };
};

function fromGoogle(volume: GoogleVolume): BookSearchResult | null {
  const info = volume.volumeInfo;
  if (!info?.title) return null;

  return {
    title: info.title,
    author: info.authors?.join(', ') ?? '지은이 미상',
    pages: info.pageCount,
    /** http로 오는 표지 주소를 https로 — 웹뷰가 아닌데도 섞여 온다 */
    cover: (
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
    )?.replace(/^http:/, 'https:'),
    publisher: info.publisher,
    genre: genreFromGoogleCategories(info.categories),
  };
}

type OpenLibraryResponse = { docs?: OpenLibraryDoc[] };
type OpenLibraryDoc = {
  title?: string;
  author_name?: string[];
  /** 판마다 쪽수가 달라서 Open Library가 여러 판의 가운데값을 준다 */
  number_of_pages_median?: number;
  cover_i?: number;
  publisher?: string[];
};

function fromOpenLibrary(doc: OpenLibraryDoc): BookSearchResult | null {
  if (!doc.title) return null;

  return {
    title: doc.title,
    author: doc.author_name?.join(', ') ?? '지은이 미상',
    pages: doc.number_of_pages_median,
    cover: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    publisher: doc.publisher?.[0],
  };
}
