import type { FetchOptions, DatabaseSubject } from './types';

import { fetchAPI } from './base';

export async function fetchSubject(bgmId: number, options: FetchOptions): Promise<DatabaseSubject> {
  const resp = await fetchAPI<any>(`/subject/${bgmId}`, {}, options);
  if (resp.ok) {
    return resp.data;
  }
  throw new Error(`Fetch subject failed`, { cause: resp });
}

export async function* fetchSubjects(options: FetchOptions = {}): AsyncGenerator<DatabaseSubject> {
  let cursor = 0;
  while (true) {
    const resp = await fetchAPI<any>(`/subjects?cursor=${cursor}`, {}, options);

    if (resp.ok) {
      for (const subject of resp.data) {
        yield subject;
      }

      cursor = resp.nextCursor;
      if (!cursor) {
        break;
      }
    } else {
      throw new Error(`Fetch subjects failed`, { cause: resp });
    }
  }
}
