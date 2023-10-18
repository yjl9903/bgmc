import fs from 'fs-extra';
import path from 'node:path';

import { rimraf } from 'rimraf';
import { BgmClient } from 'bgmc';

import type { FullBangumi } from '../src/types';

import { transform } from '../src/transform';

import { BangumiItem, OfflineBangumi, OfflineTMDB } from './offline';

const outDir = './data';

const tmdbDB = new OfflineTMDB();
const bangumiDB = new OfflineBangumi();

await clearOutDir(outDir);
await tmdbDB.load();
await bangumiDB.load();

await buildFull(path.join(outDir, 'full.json'));
await buildIndex(path.join(outDir, 'index.json'));
await buildCalendar(path.join(outDir, 'calendar.json'));

async function buildFull(output: string) {
  const bangumis = [...bangumiDB.values()].map((bgm) =>
    transform(bgm.bangumi, {
      data: bangumiDB.getItem(bgm),
      tmdb: getTMDB(bgm)
    })
  );
  await fs.writeFile(output, JSON.stringify({ bangumis }));
}

async function buildIndex(output: string) {
  const bangumis = [...bangumiDB.values()]
    .map((bgm) =>
      transform(
        bgm.bangumi,
        { data: bangumiDB.getItem(bgm), tmdb: getTMDB(bgm) },
        { omit: ['summary', 'tmdb.overview'] }
      )
    )
    .filter((b) => b.type === 'tv' || b.type === 'movie');
  await fs.writeFile(output, JSON.stringify({ bangumis }));
}

async function buildCalendar(output: string) {
  const client = new BgmClient(fetch);
  const calendar = await client.calendar();

  const bangumis: FullBangumi[][] = [[], [], [], [], [], [], [], []];
  for (const day of calendar) {
    if (day.weekday && day.weekday.id !== undefined && day.weekday.id !== null) {
      const id = day.weekday.id - 1;
      bangumis[id].push(
        ...((day.items ?? [])
          .map((d) => {
            if (d.id) {
              const bgm = bangumiDB.getById(d.id);
              if (bgm) {
                return transform(
                  bgm.bangumi,
                  {
                    data: bangumiDB.getItem(bgm),
                    tmdb: getTMDB(bgm)
                  },
                  { omit: ['tmdb.overview'] }
                );
              }
            }
          })
          .filter(Boolean) as FullBangumi[])
      );
    }
  }

  await fs.writeFile(output, JSON.stringify({ calendar: bangumis }));
}

async function clearOutDir(outDir: string) {
  await rimraf(outDir);
  await fs.mkdirp(outDir);
}

function getTMDB(bgm: BangumiItem) {
  const tmdb = tmdbDB.getById(bgm.bangumi.id);
  if (!tmdb) return undefined;

  return {
    // @ts-expect-error
    name: tmdb.tmdb.search.title,
    // @ts-expect-error
    original_name: tmdb.tmdb.search.original_title,
    ...tmdb.tmdb,
    ...tmdb.tmdb.search,
    type: tmdb.tmdb.type as 'tv' | 'movie'
  };
}
