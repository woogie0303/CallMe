import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type BookSearchResult = {
  title: string;
  author: string;
  pages?: number;
  cover?: string;
  publisher?: string;
};

/**
 * 책을 찾아준다. 원서를 읽는 독자가 검색하는 대상은 대체로 영어 원문 그대로의
 * 책이라, 국내 서점 API(알라딘·카카오·네이버)보다 구글 북스가 적중률이 높다 —
 * 그 셋은 번역판·국내서 위주로 색인돼 있어 원서가 잘 안 걸리거나 번역판이 먼저
 * 뜬다. 구글 북스는 가입 없이 바로 쓸 수 있어 시작하기도 쉽다.
 *
 * 나중에 한국 서점 쪽 메타데이터(정가·품절 여부 같은)가 필요해지면 알라딘
 * Open API(TTBKey, 무료 발급)로 바꿔 낀다 — 이 파일 하나만 갈아 끼우면 된다.
 */
@Injectable()
export class BookSearchService {
  private readonly log = new Logger(BookSearchService.name);

  constructor(private readonly config: ConfigService) {}

  async search(query: string): Promise<BookSearchResult[]> {
    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', '20');
    /** 한국 서점에 실제로 들어와 있는 판을 먼저 보여준다 */
    url.searchParams.set('country', 'KR');
    /**
     * 키 없는 요청은 구글이 IP 단위로 쿼터를 매기는데, 이 쿼터는 같은 네트워크를
     * 쓰는 다른 프로젝트와 함께 쓴다 — 개발 중에도 종종 429가 난다. 키를 달면
     * 이 앱만의 쿼터(하루 1000회, 무료)로 바뀐다. Google Cloud Console에서
     * 발급만 받으면 되고, 서점 가입 같은 절차가 없다.
     */
    const key = this.config.get<string>('GOOGLE_BOOKS_API_KEY');
    if (key) url.searchParams.set('key', key);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      this.log.warn(`책 검색이 응답하지 않아요: ${String(error)}`);
      return [];
    }

    if (!response.ok) {
      this.log.warn(`책 검색 ${response.status}`);
      return [];
    }

    const body = (await response.json()) as GoogleBooksResponse;
    return (body.items ?? [])
      .map(toResult)
      .filter((book): book is BookSearchResult => book !== null);
  }
}

type GoogleBooksResponse = { items?: GoogleVolume[] };
type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    pageCount?: number;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

function toResult(volume: GoogleVolume): BookSearchResult | null {
  const info = volume.volumeInfo;
  if (!info?.title) return null;

  return {
    title: info.title,
    author: info.authors?.join(', ') ?? '지은이 미상',
    pages: info.pageCount,
    /** http로 오는 표지 주소를 https로 — 웹뷰가 아닌데도 섞여 온다 */
    cover: (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)?.replace(
      /^http:/,
      'https:',
    ),
    publisher: info.publisher,
  };
}
