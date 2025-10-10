import fs from 'fs-extra';
import path from 'node:path';

import { rimraf } from 'rimraf';
import { BgmClient } from 'bgmc';

import type { FullBangumi } from 'bgmc/types';

import { transform } from '../../../bgmd/src/transform';

import type { Context } from '../types';

import { inferOnairMonth, YucCalendarItem } from '../fetch';
import { BangumiItem, OfflineBangumi, OfflineTMDB } from '../offline';

export async function buildData(ctx: Context) {
  const outDir = ctx.outDir;

  const tmdbDB = new OfflineTMDB(ctx.tmdbRoot);
  const bangumiDB = new OfflineBangumi(ctx.bangumiRoot);

  await clearOutDir(outDir);
  await tmdbDB.load();
  await bangumiDB.load();

  await buildFull(path.join(outDir, 'full.json'));
  await buildIndex(path.join(outDir, 'index.json'));
  (await buildYucCalendar(ctx.root, path.join(outDir, 'calendar.json'))) ||
    (await buildBangumiCalendar(path.join(outDir, 'calendar.json')));

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

  async function buildYucCalendar(root: string, output: string) {
    try {
      const [year, month] = inferOnairMonth();
      const content = JSON.parse(
        await fs.readFile(
          path.join(root, 'yuc', `${year}${String(month).padStart(2, '0')}.json`),
          'utf-8'
        )
      ) as { calendar: YucCalendarItem[][]; web: YucCalendarItem[] };

      const bangumis: FullBangumi[][] = [[], [], [], [], [], [], []];
      const web: FullBangumi[] = [];
      const tranform = (id: number) => {
        const bgm = bangumiDB.getById(id);
        if (bgm) {
          const res = transform(
            bgm.bangumi,
            {
              data: bangumiDB.getItem(bgm),
              tmdb: getTMDB(bgm)
            },
            { omit: ['tmdb.overview'] }
          );
          return res;
        }
        return undefined;
      };
      for (let i = 0; i < content.calendar.length; i++) {
        for (const item of content.calendar[i]) {
          const res = tranform(item.id);
          if (res) {
            bangumis[i].push(res);
          }
        }
      }
      for (const item of content.web) {
        const res = tranform(item.id);
        if (res) {
          web.push(res);
        }
      }

      await fs.writeFile(output, JSON.stringify({ calendar: bangumis, web }), 'utf-8');

      return true;
    } catch {
      return false;
    }
  }

  async function buildBangumiCalendar(output: string) {
    const client = new BgmClient(fetch);
    const calendar = await client.calendar();

    const bangumis: FullBangumi[][] = [[], [], [], [], [], [], []];
    const visited = new Set<number>();
    for (const day of calendar) {
      if (day.weekday && day.weekday.id !== undefined && day.weekday.id !== null) {
        const id = day.weekday.id - 1;
        const items = day.items ?? [];
        const transformed = items
          .map((d) => {
            if (d.id) {
              const bgm = bangumiDB.getById(d.id);
              if (bgm) {
                const eps = bgm.bangumi.total_episodes;
                // Skip pv with only one epsiode
                if (
                  eps <= 1 &&
                  bgm.bangumi.date &&
                  bgm.bangumi.platform !== 'TV' &&
                  new Date(bgm.bangumi.date).getTime() < new Date().getTime()
                ) {
                  return undefined;
                }

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
          .filter(Boolean) as FullBangumi[];

        for (const item of transformed) {
          visited.add(item.bangumi!.id);
        }

        // Skip 番外短片
        transformed.splice(
          0,
          transformed.length,
          ...transformed.filter((item) => {
            const bgm = bangumiDB.getById(item.bangumi!.id)!;
            for (const rel of bgm.bangumi.relations) {
              if (rel.relation === '主线故事') {
                if (visited.has(rel.id)) {
                  return false;
                }
              }
            }
            return true;
          })
        );

        bangumis[id].push(...transformed);
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
}
