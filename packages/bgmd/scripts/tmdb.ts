import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { items, type Item } from 'bangumi-data';
import { TMDBClient, type SearchResultItem } from 'tmdbc';

import { ufetch } from './ufetch';
import { groupByBegin } from './utils';

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

async function downloadSubject(file: string, items: Item[]) {
  const client = new TMDBClient({
    baseURL: 'https://movies-proxy.vercel.app/tmdb/',
    fetch: ufetch,
    token: ''
  });

  const bangumis: SearchResultItem[] = [];
  for (const item of items) {
    const result = await search(item);
    if (result) {
      bangumis.push(result);
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
          all.push(...resp.results);
          const result = inferBangumi(item, resp.results);
          if (result) {
            return result;
          }
        }
      }
      if (all.length === 0) {
        console.log(`Error: There is no search result for ${item.title}`);
      } else {
        console.log(`Error: There is multiple search results for ${item.title}`);
      }
    }

    function inferBangumi(item: Item, resp: SearchResultItem[]) {
      if (resp.length === 1) {
        return resp[0];
      } else {
      }
    }
  }

  await fs.writeFile(file, JSON.stringify(bangumis, null, 2));
}
