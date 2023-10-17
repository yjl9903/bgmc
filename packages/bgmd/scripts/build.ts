import fs from 'fs-extra';
import path from 'node:path';

import { rimraf } from 'rimraf';

import { transform } from '../src/transform';

import { OfflineBangumi, OfflineTMDB } from './offline';

const outDir = './data';

const tmdbDB = new OfflineTMDB();
const bangumiDB = new OfflineBangumi();

await clearOutDir(outDir);

await build(path.join(outDir, 'full.json'));

async function build(output: string) {
  await bangumiDB.load();
  await tmdbDB.load();
  const bangumis = [...bangumiDB.values()].map((bgm) =>
    transform(bgm.bangumi, { data: bangumiDB.getItem(bgm), tmdb: tmdbDB.getById(bgm.bangumi.id) })
  );
  await fs.writeFile(output, JSON.stringify({ bangumis }));
}

async function clearOutDir(outDir: string) {
  await rimraf(outDir);
  await fs.mkdirp(outDir);
}
