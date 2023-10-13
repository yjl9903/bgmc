import fs from 'fs-extra';
import path from 'node:path';

import { breadc } from 'breadc';
import {
  TMDBClient,
  type SearchResultItem,
  type SearchTVResultItem,
  type SearchMovieResultItem,
  type SearchMultiResultItem
} from 'tmdbc';

import { ufetch } from './ufetch';
import { groupByBegin } from './utils';
import { BangumiItem, OfflineBangumi, TMDBDataRoot, type TMDBItem } from './offline';

await fs.ensureDir(TMDBDataRoot);

const client = new TMDBClient({
  fetch: ufetch,
  token:
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMjBjZDIyODM5NjY2NjQ5MGQ0OTAwYTJjNDlkMTc3OCIsInN1YiI6IjY0NmU1MWY4NzFmZmRmMDBlNTIxZjQwZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Hq1rcsdLYHGI51TFCIc1GLFC8PBGYcflG_sC2DQdGfQ'
});

const bangumiDB = new OfflineBangumi();

async function main() {
  await bangumiDB.load();
  const files = groupByBegin([...bangumiDB.values()], (bgm) => {
    if (bgm.date) {
      return new Date(bgm.date);
    }
    console.log(`Error: the date of ${bgm.title} is empty`);
  });

  for (const [year, yearData] of files) {
    const dir = path.join(TMDBDataRoot, '' + year);
    await fs.ensureDir(dir);
    for (const [month, monthData] of yearData) {
      const file = path.join(dir, `${String(month).padStart(2, '0')}.json`);
      await downloadSubject(file, monthData);
    }
  }
}

async function downloadSubject(file: string, items: BangumiItem[]) {
  const cache = await fs
    .readFile(file, 'utf-8')
    .then((c) => JSON.parse(c) as TMDBItem[])
    .catch(() => undefined);
  const found = new Map<string, TMDBItem>(cache?.map((c) => [c.title, c]));

  const bangumis: TMDBItem[] = [];

  for (const item of items) {
    if (found.has(item.title)) {
      const cache = found.get(item.title)!;
      bangumis.push(cache);
      continue;
    }

    const result = await search(item);
    if (result.ok) {
      bangumis.push({
        title: item.title,
        date: item.date,
        bangumi: { id: '' + item.bangumi.id },
        tmdb: {
          id: result.ok.id,
          season: result.season,
          search: result.ok
        }
      });
    }
  }

  await fs.writeFile(file, JSON.stringify(bangumis, null, 2));
}

async function search(bgm: BangumiItem) {
  const item = bangumiDB.getItem(bgm);
  const all: SearchResultItem[] = [];
  const names = new Set([bgm.title, ...Object.values(item?.titleTranslate ?? {}).flat()]);

  for (const query of names) {
    const resp =
      item?.type === 'movie'
        ? await client.searchMovie({ query, language: 'zh-CN' })
        : item?.type === 'tv'
        ? await client.searchTV({ query, language: 'zh-CN' })
        : await client.searchMulti({ query, language: 'zh-CN' });

    if (resp.results.length > 0) {
      const result = inferBangumi(bgm, resp.results);
      all.push(...result.all);
      if (result.ok) {
        return result;
      }
    }
  }

  // Check prequel
  if (all.length === 0 && (item?.type === 'tv' || !item)) {
    const begin = new Date(bgm.date);
    const pres = bangumiDB.listPrequel(bgm);

    for (const bgm of pres) {
      const resp = await client.searchTV({ query: bgm.title, language: 'zh-CN' });

      if (resp.results.length > 0) {
        const filtered: Array<{ ok: SearchTVResultItem; season: number }> = [];
        for (const r of resp.results) {
          const detail = await client.getTVDetail(r.id, { language: 'zh-CN' });
          for (const s of detail.seasons) {
            if (checkInterval(begin, new Date(s.air_date))) {
              filtered.push({ ok: r, season: s.season_number });
            }
          }
        }
        all.push(...filtered.map((f) => f.ok));

        if (filtered.length === 1) {
          const result = filtered[0];
          console.log(
            `Info: infer ${bgm.title} to ${getOriginalNameOrTitle(result.ok)} (id: ${
              result.ok.id
            }, season: ${result.season})`
          );
          return {
            ok: result.ok,
            season: result.season,
            all
          };
        }
      }
    }
  }

  if (all.length === 0) {
    console.log(`Error: There is no search result for ${bgm.title}`);
  } else {
    console.log(`Error: There is multiple search results for ${bgm.title}`);
  }

  return { ok: undefined, season: undefined, all };

  function inferBangumi(
    item: BangumiItem,
    resp: (SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem)[]
  ) {
    const filtered = resp.filter((r) => matchBangumi(item, r));
    if (resp.length === 1 && filtered.length === 1) {
      return { ok: resp[0], all: filtered };
    } else {
      if (filtered.length === 1) {
        const result = filtered[0];
        console.log(
          `Info: infer ${item.title} to ${getOriginalNameOrTitle(result)} (id: ${result.id})`
        );
        return { ok: result, season: undefined, all: filtered };
      }
      return { ok: undefined, season: undefined, all: filtered };
    }
  }

  function matchBangumi(
    bgm: BangumiItem,
    result: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem
  ) {
    const d1 = new Date(bgm.date);
    // @ts-ignore
    const d2 = new Date(result.first_air_date || result.release_date);
    // Onair date should be less than 7 days
    if (!checkInterval(d1, d2)) {
      return false;
    }
    return true;
  }

  function checkInterval(d1: Date, d2: Date) {
    return Math.abs(d1.getTime() - d2.getTime()) <= 7 * 24 * 60 * 60 * 1000;
  }

  function getNameOrTitle(
    resp: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem
  ) {
    // @ts-ignore
    return resp.name || resp.title;
  }

  function getOriginalNameOrTitle(
    resp: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem
  ) {
    // @ts-ignore
    return resp.original_name || resp.original_title;
  }
}

const cli = breadc('tmdb');

cli.command('').action(async (options) => {
  await main();
});

cli.command('search <keyword>').action(async (keyword, options) => {});

cli.command('validate').action(async (options) => {});

cli.run(process.argv.slice(2)).catch((err) => console.error(err));
