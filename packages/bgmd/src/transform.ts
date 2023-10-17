import type { Item } from 'bangumi-data';
import type { SubjectInformation } from 'bgmc';

import { FullBangumi } from './types';

export function transform(
  bgm: SubjectInformation,
  extra: { data?: Item; tmdb?: {} } = {}
): FullBangumi {
  return {
    id: +bgm.id,
    name: bgm.name,
    alias: [],
    summary: bgm.summary,
    type: extra.data?.type ?? 'tv',
    air_date: bgm.date ?? extra.data?.begin ?? ''
  };
}
