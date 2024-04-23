import { MutableMap } from '@onekuma/map';

import { distance } from 'fastest-levenshtein';

export function measureSimiliarity(t1: string, t2: string) {
  const dis = distance(t1, t2);
  return 1 - dis / Math.max(t1.length, t2.length);
}

export function groupByBegin<T extends {}>(items: T[], fn: (item: T) => Date | undefined) {
  const map = new MutableMap<number, MutableMap<number, T[]>>();
  for (const item of items) {
    const begin = fn(item);
    if (!begin) continue;
    const year = begin.getFullYear();
    const month = begin.getMonth() + 1;
    map
      .getOrPut(year, () => new MutableMap())
      .getOrPut(month, () => [])
      .push(item);
  }
  return map;
}
