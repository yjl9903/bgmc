import type { FullBangumi } from './types';

export async function getRecentBangumis(): Promise<Omit<FullBangumi, 'summary'>[]> {
  const resp = await fetch(`https://unpkg.com/bgmd@0/data/index.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd index.json failed`, { cause: resp });
  }
  const data = await resp.json();
  return data.bangumis;
}

export async function getFullBangumis(): Promise<FullBangumi[]> {
  const resp = await fetch(`https://unpkg.com/bgmd@0/data/full.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd full.json failed`, { cause: resp });
  }
  const data = await resp.json();
  return data.bangumis;
}

export async function getCalendar(): Promise<
  [
    FullBangumi[],
    FullBangumi[],
    FullBangumi[],
    FullBangumi[],
    FullBangumi[],
    FullBangumi[],
    FullBangumi[]
  ]
> {
  const resp = await fetch(`https://unpkg.com/bgmd@0/data/calendar.json`);
  if (!resp.ok) {
    throw new Error(`Fetch bgmd calendar.json failed`, { cause: resp });
  }
  const data = await resp.json();
  return data.calendar;
}
