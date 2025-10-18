import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

import type { CalendarSubject } from '../client';

export async function dumpDataBy<T>(
  rootDir: string,
  data: T[],
  groupBy: (item: T) => string,
  sortBy: (left: T, right: T) => number
) {
  await mkdir(rootDir, { recursive: true });

  const grouped = new Map<string, T[]>();
  for (const item of data) {
    const key = groupBy(item);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }

  const entries = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));

  await Promise.all(
    entries.map(async ([key, items]) => {
      const filePath = path.join(rootDir, key) + '.json';

      await mkdir(path.dirname(filePath), { recursive: true });

      await writeFile(filePath, JSON.stringify(items.sort(sortBy), null, 2), 'utf-8');
    })
  );
}

export async function dumpCalendar(
  file: string,
  calendar: CalendarSubject[][],
  web: CalendarSubject[]
) {
  await writeFile(file, JSON.stringify({ calendar, web }, null, 2), 'utf-8');
}
