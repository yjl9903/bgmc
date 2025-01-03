import { breadc } from 'breadc';
import { buildData } from './build';
import { fetchData } from './fetch';

const cli = breadc('bgmx');

cli.command('build')
  .action(async (options) => {
    await buildData();
  });

cli
  .command('fetch')
  .option('--overwrite')
  .action(async (options) => {
    await fetchData(options);
  });

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
