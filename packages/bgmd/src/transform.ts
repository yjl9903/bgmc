import type { Item } from 'bangumi-data';
import type { PartialDeep } from 'type-fest';

import { type SubjectInformation, getSubjectAlias } from 'bgmc';

import type { FullBangumi } from './types';

export interface TransformOptions {
  omit?: (
    | `tmdb.${keyof FullBangumi['tmdb']}`
    | `bangumi.${keyof FullBangumi['bangumi']}`
    | keyof FullBangumi
  )[];

  filter?: {};
}

export function transform<T extends PartialDeep<FullBangumi> = FullBangumi>(
  bgm: Omit<SubjectInformation, 'rating' | 'collection' | 'tags'> & {
    tags: string[] | Array<{ name: string; count: number }>;
  },
  extra: { data?: Item; tmdb?: FullBangumi['tmdb'] } = {},
  options: TransformOptions = {}
): T {
  const alias = [
    ...getSubjectAlias(bgm),
    ...Object.values(extra?.data?.titleTranslate ?? {}).flat()
  ];

  const full: FullBangumi = {
    id: +bgm.id,
    name: bgm.name,
    alias: [...new Set(alias)],
    summary: bgm.summary,
    type: extra.data?.type ?? 'tv',
    air_date: bgm.date ?? extra.data?.begin ?? '',
    bangumi: {
      id: +bgm.id,
      name_cn: bgm.name_cn,
      images: bgm.images,
      tags: normalizeTags(bgm.tags)
    }
  };

  if (extra.tmdb) {
    full.tmdb = {
      id: extra.tmdb.id,
      name: extra.tmdb.name,
      original_name: extra.tmdb.original_name,
      overview: extra.tmdb.overview,
      type: extra.tmdb.type,
      season: extra.tmdb.season,
      first_episode: extra.tmdb.first_episode,
      backdrop_path: extra.tmdb.backdrop_path,
      poster_path: extra.tmdb.poster_path
    };
  }

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

function normalizeTags(tags: string[] | Array<{ name: string; count: number }>) {
  return tags?.map((t) => (typeof t === 'string' ? t : t.name)) ?? [];
}
