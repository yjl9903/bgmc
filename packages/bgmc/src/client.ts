import type {
  Query,
  BGMCollection,
  BGMCollectionParams,
  BGMSearch,
  BGMSearchParams,
  BGMSubject,
  BGMPerson
} from './types';

import { BgmFetchError } from './error';

export type Calendar = BGMSubject.Calendar;

export type SubjectInformation = BGMSubject.Information;

export type SubjectPersons = BGMSubject.Persons;

export type SubjectCharacters = BGMSubject.Characters;

export type RelatedSubject = BGMSubject.Subjects[0];

export type PersonInformation = BGMPerson.Information;

export type PersonSubjects = BGMPerson.Subjects;

export type PersonCharacters = BGMPerson.Characters;

export type Search = BGMSearch.Search;

export type CollectionInformation = BGMCollection.Information;

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
    return this.request<Calendar>('/calendar');
  }

  public subject(id: number) {
    return this.request<SubjectInformation>(`/v0/subjects/${id}`);
  }

  public subjectPersons(id: number) {
    return this.request<SubjectPersons>(`/v0/subjects/${id}/persons`);
  }

  public subjectCharacters(id: number) {
    return this.request<SubjectCharacters>(`/v0/subjects/${id}/characters`);
  }

  public subjectRelated(id: number) {
    return this.request<RelatedSubject[]>(`/v0/subjects/${id}/subjects`);
  }

  public person(id: number) {
    return this.request<PersonInformation>(`/v0/persons/${id}`);
  }

  public personSubjects(id: number) {
    return this.request<PersonSubjects>(`/v0/persons/${id}/subjects`);
  }

  public personCharacters(id: number) {
    return this.request<PersonCharacters>(`/v0/persons/${id}/characters`);
  }

  public search(keywords: string, query?: Query<BGMSearchParams.Search>) {
    return this.request<Search>(`/search/subject/${keywords}`, query);
  }

  public getCollections(username: string, query?: Query<BGMCollectionParams.Information>) {
    return this.request<CollectionInformation>(`/v0/users/${username}/collections`, query);
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
        const resp = await this.fetch(url.toString(), {
          headers: { 'User-Agent': BgmClient.userAgent }
        });
        if (!resp.ok || resp.status !== 200) {
          throw new BgmFetchError(resp);
        }
        return await resp.json();
      } catch (err) {
        if (err instanceof BgmFetchError) {
          if (err.response.status === 404) {
            throw err;
          }
        }
        if (i + 1 === maxRetry) {
          throw err;
        }
      }
    }
    throw new Error('unreachable');
  }
}
