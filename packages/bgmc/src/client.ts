import type {
  BGMCollection,
  BGMCollectionParams,
  BGMSearch,
  BGMSearchParams,
  BGMSubject,
  Query
} from './types';

export class BgmClient {
  static baseURL = 'https://api.bgm.tv';

  static userAgent = 'bgmc (https://www.npmjs.com/package/bgmc)';

  private readonly maxRetry;

  private readonly fetch: (request: RequestInfo, init?: RequestInit) => Promise<Response>;

  constructor(
    fetch: (request: RequestInfo, init?: RequestInit) => Promise<Response>,
    { maxRetry = 5 }: { maxRetry?: number } = {}
  ) {
    this.fetch = fetch;
    this.maxRetry = maxRetry <= 0 ? Number.MAX_SAFE_INTEGER : maxRetry;
  }

  public calendar() {
    return this.request<BGMSubject.Calendar>('/calendar');
  }

  public subject(id: number) {
    return this.request<BGMSubject.Information>(`/v0/subjects/${id}`);
  }

  public subjectPersons(id: number) {
    return this.request<BGMSubject.Persons>(`/v0/subjects/${id}/persons`);
  }

  public subjectCharacters(id: number) {
    return this.request<BGMSubject.Characters>(`/v0/subjects/${id}/characters`);
  }

  public subjectRelated(id: number) {
    return this.request<BGMSubject.Subjects>(`/v0/subjects/${id}/subjects`);
  }

  public search(keywords: string, query?: Query<BGMSearchParams.Search>) {
    return this.request<BGMSearch.Search>(`/search/subject/${keywords}`, query);
  }

  public getCollections(username: string, query?: Query<BGMCollectionParams.Information>) {
    return this.request<BGMCollection.Information>(`/v0/users/${username}/collections`, query);
  }

  public async request<T>(pathname: string, query: Record<string, any> = {}): Promise<T> {
    const url = new URL(pathname, BgmClient.baseURL);
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    const maxRetry = this.maxRetry;
    for (let i = 0; i < maxRetry; i++) {
      try {
        return await this.fetch(url.toString(), {
          headers: { 'User-Agent': BgmClient.userAgent }
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
