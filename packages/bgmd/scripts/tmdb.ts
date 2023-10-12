import fs from 'fs-extra';
import path from 'node:path';

import { breadc } from 'breadc';
import { items, type Item } from 'bangumi-data';
import {
  TMDBClient,
  type SearchResultItem,
  type SearchTVResultItem,
  type SearchMovieResultItem,
  type SearchMultiResultItem
} from 'tmdbc';

import { ufetch } from './ufetch';
import { groupByBegin } from './utils';
import { OfflineBangumi, TMDBDataRoot, type TMDBItem } from './offline';

await fs.ensureDir(TMDBDataRoot);

const client = new TMDBClient({
  baseURL: 'https://movies-proxy.vercel.app/tmdb/',
  fetch: ufetch,
  token: ''
});

const bangumiDB = new OfflineBangumi();

async function main() {
  await bangumiDB.load();

  const files = groupByBegin(items);
  for (const [year, yearData] of files) {
    const dir = path.join(TMDBDataRoot, '' + year);
    await fs.ensureDir(dir);
    for (const [month, monthData] of yearData) {
      const file = path.join(dir, `${String(month).padStart(2, '0')}.json`);
      await downloadSubject(file, monthData);
    }
  }
}

async function downloadSubject(file: string, items: Item[]) {
  const cache = await fs
    .readFile(file, 'utf-8')
    .then((c) => JSON.parse(c) as TMDBItem[])
    .catch(() => undefined);
  const found = new Map<string, TMDBItem>(cache?.map((c) => [c.title, c]));

  const bangumis: TMDBItem[] = [];

  for (const item of items) {
    if (found.has(item.title)) {
      bangumis.push(found.get(item.title)!);
      continue;
    }

    const bgm = item.sites.find((site) => site.site === 'bangumi');
    if (!bgm) continue;

    const result = await search(item);
    if (result.ok) {
      bangumis.push({
        title: item.title,
        bangumi: { id: bgm.id },
        tmdb: {
          id: result.ok.id,
          search: result.ok
        }
      });
    }
  }

  await fs.writeFile(file, JSON.stringify(bangumis, null, 2));
}

async function search(item: Item) {
  const all: SearchResultItem[] = [];
  const names = new Set([item.title, ...Object.values(item.titleTranslate).flat()]);

  for (const query of names) {
    const resp =
      item.type === 'movie'
        ? await client.searchMovie({ query, language: 'zh-CN' })
        : item.type === 'tv'
        ? await client.searchTV({ query, language: 'zh-CN' })
        : await client.searchMulti({ query, language: 'zh-CN' });
    if (resp.results.length > 0) {
      const result = inferBangumi(item, resp.results);
      all.push(...result.all);
      if (result.ok) {
        return result;
      }
    }
  }

  if (all.length === 0 && item.type === 'tv') {
    const pres = bangumiDB.listPrequel(item);
    for (const bgm of pres) {
      const resp = await client.searchTV({ query: bgm.title, language: 'zh-CN' });
      if (resp.results.length > 0) {
      }
    }
  }

  if (all.length === 0) {
    console.log(`Error: There is no search result for ${item.title}`);
  } else {
    console.log(`Error: There is multiple search results for ${item.title}`);
  }

  return { ok: undefined, all };

  function inferBangumi(
    item: Item,
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
        return { ok: result, all: filtered };
      }
      return { ok: undefined, all: filtered };
    }
  }

  function matchBangumi(
    item: Item,
    result: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem
  ) {
    const d1 = new Date(item.begin);
    // @ts-ignore
    const d2 = new Date(result.first_air_date || result.release_date);
    // Onair date should be less than 7 days
    if (Math.abs(d1.getTime() - d2.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
    return true;
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
