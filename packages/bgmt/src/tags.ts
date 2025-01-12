import { fullToHalf, tradToSimple } from 'simptrad';

export interface Tag {
  name: string;

  count: number;
}

export interface NormalizeTagsOptions {
  /**
   * @default 0
   */
  count?: number;
}

export function normalizeTags(tags: Tag[], options: NormalizeTagsOptions = {}) {
  const merged = mergeSimpleTags(tags);
  const reliable = options.count ? merged.filter(t => t.count >= options.count!) : merged;
  return reliable.map(t => t.name);
}

function mergeSimpleTags(tags: Tag[]) {
  const map = new Map<string, number>();
  for (const t of tags) {
    const name = fullToHalf(tradToSimple(t.name), { punctuation: true });
    map.set(name, (map.get(name) ?? 0) + t.count);
  }
  return [...map.entries()].map(([k, v]) => ({ name: k, count: v }));
}
