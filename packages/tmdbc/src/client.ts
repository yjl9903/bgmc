import type { SearchTVQuery, SearchMovieQuery, SearchResult, SearchResultItem } from './types';

export type { SearchTVQuery, SearchMovieQuery, SearchResult, SearchResultItem };

export interface TMDBClientOptions {
  fetch?: (request: RequestInfo, init?: RequestInit) => Promise<Response>;

  /**
   * @default 'https://api.themoviedb.org/3/'
   */
  baseURL?: string;

  token: string;

  /**
   * @default 5
   */
  maxRetry?: number;
}

export class TMDBClient {
  private readonly fetch: (request: RequestInfo, init?: RequestInit) => Promise<Response>;

  private readonly baseURL: string;

  private readonly maxRetry: number;

  private readonly token: string;

  public constructor(options: TMDBClientOptions) {
    this.fetch = options.fetch ?? fetch;
    this.baseURL = options.baseURL ?? 'https://api.themoviedb.org/3/';
    this.maxRetry = options.maxRetry ?? 5;
    this.token = options.token;
  }

  public async searchMovie(query: SearchMovieQuery) {
    return this.request<SearchResult<SearchResultItem>>(`/search/movie`, <SearchTVQuery>{
      include_adult: false,
      language: 'en-US',
      page: 1,
      ...query
    });
  }

  public async searchTV(query: SearchTVQuery) {
    return this.request<SearchResult<SearchResultItem>>(`/search/tv`, <SearchTVQuery>{
      include_adult: false,
      language: 'en-US',
      page: 1,
      ...query
    });
  }

  private async request<T>(pathname: string, query: Record<string, any> = {}): Promise<T> {
    const url = new URL(pathname, this.baseURL);
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const maxRetry = this.maxRetry;
    for (let i = 0; i < maxRetry; i++) {
      try {
        return await this.fetch(url.toString(), {
          headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' }
        }).then((r) => r.json());
      } catch (err) {
        if (i + 1 === maxRetry) {
          throw err;
        }
      }
    }
    throw new Error('unreachable');
  }
}
