import fs from 'fs-extra';
import path from 'node:path';

import { rimraf } from 'rimraf';

import { transform } from '../src/transform';

import { OfflineBangumi, OfflineTMDB } from './offline';

const outDir = './data';

const tmdbDB = new OfflineTMDB();
const bangumiDB = new OfflineBangumi();

await clearOutDir(outDir);
await tmdbDB.load();
await bangumiDB.load();

await buildFull(path.join(outDir, 'full.json'));
await buildIndex(path.join(outDir, 'index.json'));

async function buildFull(output: string) {
  const bangumis = [...bangumiDB.values()].map((bgm) =>
    transform(bgm.bangumi, { data: bangumiDB.getItem(bgm), tmdb: tmdbDB.getById(bgm.bangumi.id) })
  );
  await fs.writeFile(output, JSON.stringify({ bangumis }));
}

async function buildIndex(output: string) {
  const bangumis = [...bangumiDB.values()].map((bgm) =>
    transform(
      bgm.bangumi,
      { data: bangumiDB.getItem(bgm), tmdb: tmdbDB.getById(bgm.bangumi.id) },
      { omit: ['summary'] }
    )
  );
  await fs.writeFile(output, JSON.stringify({ bangumis }));
}

async function clearOutDir(outDir: string) {
  await rimraf(outDir);
  await fs.mkdirp(outDir);
}
