import type { Item } from 'bangumi-data';
import type { SubjectInformation } from 'bgmc';
import type { PartialDeep } from 'type-fest';

import type { FullBangumi } from './types';

interface TransformOptions {
  omit?: (
    | keyof FullBangumi
    | `bangumi.${keyof FullBangumi['bangumi']}`
    | `tmdb.${keyof FullBangumi['tmdb']}`
  )[];

  filter?: {};
}

export function transform<T extends PartialDeep<FullBangumi> = FullBangumi>(
  bgm: Omit<SubjectInformation, 'rating' | 'collection' | 'tags'> & {
    tags: string[] | Array<{ name: string; count: number }>;
  },
  extra: { data?: Item; tmdb?: {} } = {},
  options: TransformOptions = {}
): T {
  const full: FullBangumi = {
    id: +bgm.id,
    name: bgm.name,
    alias: [] as string[],
    summary: bgm.summary,
    type: extra.data?.type ?? 'tv',
    air_date: bgm.date ?? extra.data?.begin ?? ''
  };

  for (const o of options.omit ?? []) {
    if (o.startsWith('bangumi.')) {
      if (full.bangumi) {
        Reflect.deleteProperty(full.bangumi, o.slice('bangumi.'.length));
      }
    } else if (o.startsWith('tmdb.')) {
      if (full.tmdb) {
        Reflect.deleteProperty(full.tmdb, o.slice('tmdb.'.length));
      }
    } else {
      Reflect.deleteProperty(full, o);
    }
  }

  return full as T;
}
