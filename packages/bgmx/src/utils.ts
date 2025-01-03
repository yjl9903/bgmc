import { MutableMap } from '@onekuma/map';

import { distance } from 'fastest-levenshtein';

export function measureSimiliarity(t1: string, t2: string) {
  const dis = distance(t1, t2);
  return 1 - dis / Math.max(t1.length, t2.length);
}

export function groupByBegin<T extends {}>(items: T[], fn: (item: T) => string | undefined) {
  const map = new MutableMap<number, MutableMap<number, T[]>>();
  for (const item of items) {
    const begin = fn(item);
    if (!begin) continue;
    const RE = /^(\d{4})-(\d{1,2})-\d{1,2}$/
    const match = RE.exec(begin);
    if (match) {
      const year = +match[1];
      const month = +match[2];
      map
        .getOrPut(year, () => new MutableMap())
        .getOrPut(month, () => [])
        .push(item);
    }
  }
  return map;
}
