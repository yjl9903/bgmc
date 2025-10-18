import type { FetchOptions, DatabaseSubject, CalendarInput } from './types';

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

export async function updateCalendar(
  calendar: CalendarInput[],
  options: FetchOptions = {}
): Promise<void> {
  const resp = await fetchAPI<any>(
    `/calendar`,
    { method: 'POST', body: JSON.stringify(calendar) },
    options
  );
  if (resp.ok) {
    return;
  }
  throw new Error(`Update calendar failed`, { cause: resp });
}

export async function fetchCalendar(options: FetchOptions = {}) {
  const resp = await fetchAPI<any>(`/calendar`, {}, options);
  if (resp.ok) {
    return;
  }
  throw new Error(`Update calendar failed`, { cause: resp });
}
