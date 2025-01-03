import path from 'node:path';

import { breadc } from 'breadc';
import { consola } from 'consola';

import type { Context } from './types';

import { buildData } from './build';
import { fetchBangumiData, fetchTmdbData } from './fetch';

const cli = breadc('bgmx')
  .option('--overwrite', 'Overwrite cached data')
  .option('--root <string>', 'Data root')
  .option('--out-dir <string>', 'Output root')

cli
  .command('search')
  .option('--id <id>')
  .action(async (options) => {
    // if (options.id) {
    //   const bgm = bangumiDB.getById(options.id);
    //   if (bgm) {
    //     const resp = await search(bgm);
    //     console.log(resp);
    //     return;
    //   }
    // }

    // console.log('Error: nothing found');
  });

cli.command('build')
  .action(async (options) => {
    const ctx = resolveOptions(options);
    await buildData(ctx);
  });

cli
  .command('fetch bangumi')
  .alias('fetch bgm')
  .action(async (options) => {
    const ctx = resolveOptions(options);
    await fetchBangumiData(ctx);
  });

cli.command('fetch tmdb')
  .action(async (options) => {
    const ctx = resolveOptions(options);
    await fetchTmdbData(ctx);
  });

function resolveOptions(options: { root?: string; outDir?: string }): Context {
  const root = options.root || path.join(process.cwd(), 'data');
  const bangumiRoot = path.join(root, 'bangumi')
  const tmdbRoot = path.join(root, 'tmdb')
  const outDir = options.outDir || (options.root
    ? options.root
    : path.join(process.cwd(), 'packages/bgmd/root'));

  return {
    ...options,
    root,
    bangumiRoot,
    tmdbRoot,
    outDir
  }
}

// main
consola.wrapConsole();

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
