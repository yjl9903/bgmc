import fs from 'fs-extra';
import path from 'node:path';

import { getSubjectAlias } from 'bgmc';
import {
  TMDBClient,
  type SearchResultItem,
  type SearchTVResultItem,
  type SearchMovieResultItem,
  type SearchMultiResultItem
} from 'tmdbc';

import type { Context } from '../types';

import { ufetch } from '../ufetch';
import { TmdbToken } from '../constants';
import { groupByBegin, measureSimiliarity } from '../utils';
import { BangumiItem, OfflineBangumi, type TMDBItem } from '../offline';

export async function fetchTmdbData(ctx: Context) {
  await fs.ensureDir(ctx.tmdbRoot);

  const Language = 'zh-CN';

  const client = new TMDBClient({
    fetch: ufetch,
    token: TmdbToken
  });

  const bangumiDB = new OfflineBangumi(ctx.bangumiRoot);
  await bangumiDB.load();

  const files = groupByBegin(
    [...bangumiDB.values()].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }),
    (bgm) => bgm.date
  );

  for (const [year, yearData] of files) {
    const dir = path.join(ctx.tmdbRoot, '' + year);
    await fs.ensureDir(dir);
    for (const [month, monthData] of yearData) {
      const file = path.join(dir, `${String(month).padStart(2, '0')}.json`);
      await downloadSubject(file, monthData);
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
      let resp =
        item?.type === 'movie'
          ? await client.searchMovie({ query, language: Language })
          : item?.type === 'tv'
            ? await client.searchTV({ query, language: Language })
            : await client.searchMulti({ query, language: Language });

      // Fallback to multi search
      if (resp.results.length === 0) {
        resp = await client.searchMulti({ query, language: Language });
      }

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
      const filtered: Array<{ ok: SearchTVResultItem; season: number; first_episode?: number }> =
        [];

      const visitedId = new Set<number>();
      for (const query of pres) {
        const resp = await client.searchTV({ query, language: Language });

        if (resp.results.length > 0) {
          for (const r of resp.results) {
            if (visitedId.has(r.id)) continue;
            visitedId.add(r.id);

            const detail = await client.getTVDetail(r.id, { language: Language });
            for (const s of detail.seasons) {
              if (checkInterval(begin, new Date(s.air_date))) {
                filtered.push({ ok: r, season: s.season_number });
              } else {
                // Try iterating episodes
                const seasonDetail = await client
                  .getTVSeasonDetail(r.id, s.season_number, {
                    language: Language
                  })
                  .catch(() => undefined);
                if (seasonDetail) {
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
          }
        }
      }

      // Prefer use anime (genre_id: 16) than real drama
      if (filtered.length > 1) {
        const anime = filtered.filter((f) => f.ok.genre_ids.includes(16));
        if (1 <= anime.length && anime.length < filtered.length) {
          filtered.splice(0, filtered.length, ...anime);
        }
      }

      // Normal season and special episode (season 0) overlapped, prefer using normal season item
      if (filtered.length > 1) {
        const season = filtered.filter((f) => f.season > 0);
        if (1 <= season.length && season.length < filtered.length) {
          filtered.splice(0, filtered.length, ...season);
        }
      }

      // Full season and nested season overlapped, prefer using full season item
      if (filtered.length > 1) {
        const season = filtered.filter((f) => !f.first_episode);
        if (1 <= season.length && season.length < filtered.length) {
          filtered.splice(0, filtered.length, ...season);
        }
      }

      // Collect the only result
      all.push(...filtered.map((f) => f.ok));
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
      console.log(
        `Error: There are multiple search results for ${bgm.title} (id: ${bgm.bangumi.id})`
      );
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

      // Onair date should be less than 6 days
      if (!checkInterval(d1, d2)) {
        return false;
      }

      if (!checkTitleSimiliarity(bgm, result)) {
        return false;
      }

      return true;
    }

    function checkInterval(d1: Date, d2: Date) {
      return Math.abs(d1.getTime() - d2.getTime()) <= 6 * 24 * 60 * 60 * 1000;
    }

    function checkTitleSimiliarity(
      bgm: BangumiItem,
      result: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem
    ) {
      const t1 = getNameOrTitle(result);
      const t2 = getOriginalNameOrTitle(result);
      const s1 = getSubjectAlias(bgm.bangumi).reduce(
        (acc, cur) => Math.max(acc, measureSimiliarity(cur, t1)),
        0
      );
      const s2 = getSubjectAlias(bgm.bangumi).reduce(
        (acc, cur) => Math.max(acc, measureSimiliarity(cur, t2)),
        0
      );
      const sim = Math.max(s1, s2);
      return sim >= 0.5;
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
}
