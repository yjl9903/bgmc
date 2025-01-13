import { fullToHalf, tradToSimple } from 'simptrad';

export function normalizeTitle(t: string) {
  return fullToHalf(tradToSimple(t), { punctuation: true });
}
