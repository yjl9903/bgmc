import fs from 'fs-extra';
import path from 'node:path';

import { items } from 'bangumi-data';
import { rimraf } from 'rimraf';

import { transform } from '../src/transform';

const outDir = './dist';

await clearOutDir(outDir);

await build(path.join(outDir, 'data.json'));

async function build(output: string) {
  const bangumis = items.map(transform);
  await fs.writeFile(output, JSON.stringify({ bangumis }));
}

async function clearOutDir(outDir: string) {
  await rimraf(outDir);
  await fs.mkdirp(outDir);
}
