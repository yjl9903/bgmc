import type { SubjectInformation } from 'bgmc';

import { fullToHalf, tradToSimple } from 'simptrad';

export function normalizeTitle(t: string) {
  return fullToHalf(tradToSimple(t), { punctuation: true });
}

export function getSubjectDisplayName(bgm?: Pick<SubjectInformation, 'name' | 'name_cn'>) {
  return bgm?.name_cn || bgm?.name || '';
}
