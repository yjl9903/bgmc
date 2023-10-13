import { MutableMap } from '@onekuma/map';

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
