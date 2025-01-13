import path from 'node:path';

import { breadc } from 'breadc';
// import { consola } from 'consola';

import type { Context } from './types';

import { buildData } from './build';
import { fetchBangumiData, fetchTmdbData, fetchYucCalendar } from './fetch';

const cli = breadc('bgmx')
  .option('--overwrite', 'Overwrite cached data', { default: false })
  .option('--root <string>', 'Data root')
  .option('--out-dir <string>', 'Output root');

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

cli.command('build').action(async (options) => {
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

cli.command('fetch tmdb').action(async (options) => {
  const ctx = resolveOptions(options);
  await fetchTmdbData(ctx);
});

cli
  .command('fetch yuc')
  .option('--year <year>')
  .option('--month <month>')
  .action(async (options) => {
    const ctx = resolveOptions(options);
    await fetchYucCalendar(
      ctx,
      options.year ? +options.year : undefined,
      options.month ? +options.month : undefined
    );
  });

function resolveOptions(options: { overwrite: boolean; root?: string; outDir?: string }): Context {
  const root = path.join(options.root || process.cwd(), 'data');
  const bangumiRoot = path.join(root, 'bangumi');
  const tmdbRoot = path.join(root, 'tmdb');
  const outDir = options.outDir || path.join(options.root || process.cwd(), 'packages/bgmd/data');

  return {
    ...options,
    root,
    bangumiRoot,
    tmdbRoot,
    outDir
  };
}

// main
// consola.wrapConsole();

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
