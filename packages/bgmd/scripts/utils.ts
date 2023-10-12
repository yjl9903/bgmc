import type { Item } from 'bangumi-data';

import { MutableMap } from '@onekuma/map';

export function groupByBegin(items: Item[]) {
  const map = new MutableMap<number, MutableMap<number, Item[]>>();
  for (const item of items) {
    if (!item.begin) continue;
    const begin = new Date(item.begin);
    const year = begin.getFullYear();
    const month = begin.getMonth() + 1;
    map
      .getOrPut(year, () => new MutableMap())
      .getOrPut(month, () => [])
      .push(item);
  }
  return map;
}
