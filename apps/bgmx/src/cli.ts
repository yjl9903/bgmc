import 'dotenv/config';

import { breadc } from 'breadc';
import { consola } from 'consola';

const cli = breadc('bgmx');

if (process.stdin.isTTY) {
  consola.wrapConsole();
}

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
