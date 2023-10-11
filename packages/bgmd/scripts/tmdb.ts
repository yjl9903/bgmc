import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MutableMap } from '@onekuma/map';
import { items, type Item } from 'bangumi-data';
import { TMDBClient, type SearchResultItem } from 'tmdbc';

import { ufetch } from './ufetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataRoot = path.join(__dirname, '../../../data/tmdb');
await fs.ensureDir(dataRoot);

const files = groupByBegin(items);
for (const [year, yearData] of files) {
  const dir = path.join(dataRoot, '' + year);
  await fs.ensureDir(dir);
  for (const [month, monthData] of yearData) {
    const file = path.join(dir, `${String(month).padStart(2, '0')}.json`);
    await downloadSubject(file, monthData);
  }
}

function groupByBegin(items: Item[]) {
  const map = new MutableMap<number, MutableMap<number, Item[]>>();
  for (const item of items) {
    if (!item.begin) continue;
    const begin = new Date(item.begin);
    const year = begin.getFullYear();
    const month = begin.getMonth() + 1;
    map
      .getOrPut(year, () => new MutableMap())
      .getOrPut(month, () => [])
      .push(item);
  }
  return map;
}

async function downloadSubject(file: string, items: Item[]) {
  const client = new TMDBClient({
    baseURL: 'https://movies-proxy.vercel.app/tmdb/',
    fetch: ufetch,
    token: ''
  });

  const bangumis: SearchResultItem[] = [];
  for (const item of items) {
    const resp =
      item.type === 'movie'
        ? await client.searchMovie({ query: item.title, language: 'zh-CN' })
        : await client.searchTV({ query: item.title, language: 'zh-CN' });

    if (resp.results.length === 1) {
      bangumis.push(resp.results[0]);
    } else if (resp.results.length === 0) {
      console.log(`There is no search result for ${item.title}`);
    } else {
      console.log(`There is multiple search results for ${item.title}`);
    }
  }

  await fs.writeFile(file, JSON.stringify(bangumis, null, 2));
}
