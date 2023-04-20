import type { BGMSubject } from 'bgm-types';

export class BgmClient {
  static baseURL = 'https://api.bgm.tv';

  static userAgent = 'bgmc (https://www.npmjs.com/package/bgmc)';

  private readonly maxRetry;

  private readonly fetch: (url: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

  constructor(
    fetch: (url: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
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

  public async request<T>(pathname: string): Promise<T> {
    const maxRetry = this.maxRetry;
    for (let i = 0; i < maxRetry; i++) {
      try {
        const url = new URL(pathname, BgmClient.baseURL);
        return await this.fetch(url, { headers: { 'User-Agent': BgmClient.userAgent } }).then((r) =>
          r.json()
        );
      } catch (err) {
        if (i + 1 === maxRetry) {
          throw err;
        }
      }
    }
    throw new Error('unreachable');
  }
}
