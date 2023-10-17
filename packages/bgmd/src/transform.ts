import type { Item } from 'bangumi-data';
import type { SubjectInformation } from 'bgmc';
import type { PartialDeep } from 'type-fest';

import type { FullBangumi } from './types';

interface TransformOptions<T extends PartialDeep<FullBangumi>> {
  omit?: {};

  filter?: {};
}

export function transform<T extends PartialDeep<FullBangumi> = FullBangumi>(
  bgm: SubjectInformation,
  extra: { data?: Item; tmdb?: {} } = {},
  options: TransformOptions<T> = {}
): T {
  return {
    id: +bgm.id,
    name: bgm.name,
    alias: [] as string[],
    summary: bgm.summary,
    type: extra.data?.type ?? 'tv',
    air_date: bgm.date ?? extra.data?.begin ?? ''
  } as T;
}
