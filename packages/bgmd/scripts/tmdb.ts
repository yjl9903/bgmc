import fs from 'fs-extra';
import path from 'node:path';

import { breadc } from 'breadc';
import { rimraf } from 'rimraf';
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
  const files = groupByBegin(
    [...bangumiDB.values()].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }),
    (bgm) => {
      if (bgm.date) {
        return new Date(bgm.date);
      }
      console.log(`Error: the date of ${bgm.title} is empty`);
    }
  );

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
          type: result.type,
          season: result.season,
          search: result.ok
        }
      });
    }
  }

  await fs.writeFile(
    file,
    JSON.stringify(
      bangumis.map((bgm) => {
        if (bgm.tmdb.search) {
          Reflect.deleteProperty(bgm.tmdb.search, 'genre_ids');
          Reflect.deleteProperty(bgm.tmdb.search, 'popularity');
          Reflect.deleteProperty(bgm.tmdb.search, 'vote_average');
          Reflect.deleteProperty(bgm.tmdb.search, 'vote_count');
        }
        return bgm;
      }),
      null,
      2
    )
  );
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
        // @ts-ignore
        const type = item?.type === 'movie' || result.ok.media_type === 'movie' ? 'movie' : 'tv';
        return {
          ok: result.ok,
          type,
          season: result.season,
          first_episode: result.first_episode,
          all: result.all
        };
      }
    }
  }

  // Check prequel
  if (all.length === 0) {
    const begin = new Date(bgm.bangumi.date || bgm.date);
    const pres = bangumiDB.listPrequel(bgm);
    const filtered: Array<{ ok: SearchTVResultItem; season: number; first_episode?: number }> = [];

    for (const preBgm of pres) {
      const resp = await client.searchTV({ query: preBgm.title, language: 'zh-CN' });

      if (resp.results.length > 0) {
        for (const r of resp.results) {
          const detail = await client.getTVDetail(r.id, { language: 'zh-CN' });
          for (const s of detail.seasons) {
            if (checkInterval(begin, new Date(s.air_date))) {
              filtered.push({ ok: r, season: s.season_number });
            } else {
              // Try iterating episodes
              const seasonDetail = await client.getTVSeasonDetail(r.id, s.season_number, {
                language: 'zh-CN'
              });
              for (const ep of seasonDetail.episodes) {
                if (checkInterval(begin, new Date(ep.air_date))) {
                  filtered.push({
                    ok: r,
                    season: ep.season_number,
                    first_episode: ep.episode_number
                  });
                  break;
                }
              }
            }
          }
        }
        all.push(...filtered.map((f) => f.ok));
      }
    }

    if (filtered.length === 1) {
      const result = filtered[0];

      const fullyear = begin.getFullYear();
      const month = String(begin.getMonth() + 1).padStart(2, '0');

      const extra = [
        `season: ${result.season}`,
        result.first_episode ? `episode: ${result.first_episode}` : undefined
      ].filter(Boolean) as string[];

      console.log(
        `Info: infer ${bgm.title} (id: ${
          bgm.bangumi.id
        }, ${fullyear}-${month}) -> ${getOriginalNameOrTitle(result.ok)} (id: ${
          result.ok.id
        }, ${extra.join(', ')})`
      );

      return {
        ok: result.ok,
        type: 'tv',
        season: result.season,
        first_episode: result.first_episode,
        all
      };
    }
  }

  if (all.length === 0) {
    console.log(`Error: There is no search result for ${bgm.title} (id: ${bgm.bangumi.id})`);
  } else {
    console.log(`Error: There are multiple search results for ${bgm.title} (id: ${bgm.bangumi.id})`);
  }

  return { ok: undefined, type: undefined, season: undefined, first_episode: undefined, all };

  function inferBangumi(
    item: BangumiItem,
    resp: (SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem)[]
  ): {
    ok: (SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem) | undefined;
    season?: number;
    first_episode?: number;
    all: (SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem)[];
  } {
    const filtered = resp.filter((r) => matchBangumi(item, r));
    if (resp.length === 1 && filtered.length === 1) {
      return { ok: resp[0], all: filtered };
    } else {
      const begin = new Date(item.date);
      const fullyear = begin.getFullYear();
      const month = String(begin.getMonth() + 1).padStart(2, '0');

      if (resp.length === 1 && filtered.length === 0) {
        // The only result is filtered out?
        const result = resp[0];
        console.log(
          `Info: infer ${item.title} (id: ${
            item.bangumi.id
          }, ${fullyear}-${month}) to ${getOriginalNameOrTitle(result)} (id: ${result.id})`
        );
        return { ok: result, all: filtered };
      }
      if (filtered.length === 1) {
        // Filter to only one result
        const result = filtered[0];

        console.log(
          `Info: infer ${item.title} (id: ${
            item.bangumi.id
          }, ${fullyear}-${month}) -> ${getOriginalNameOrTitle(result)} (id: ${result.id})`
        );
        return { ok: result, all: filtered };
      }
      return { ok: undefined, all: filtered };
    }
  }

  function matchBangumi(
    bgm: BangumiItem,
    result: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem
  ) {
    const d1 = new Date(bgm.bangumi.date || bgm.date);
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

cli
  .command('')
  .option('--overwrite')
  .action(async (options) => {
    if (options.overwrite) {
      await rimraf(TMDBDataRoot).catch(() => {});
    }

    await main();
  });

cli.command('search <keyword>').action(async (keyword, options) => {});

cli.command('validate').action(async (options) => {});

cli.run(process.argv.slice(2)).catch((err) => console.error(err));
