import { ofetch } from 'ofetch';
import { breadc } from 'breadc';

import { version } from '../package.json';

import { BgmClient } from './client';

const cli = breadc('bgmc', { version });

const client = new BgmClient(ofetch.native);

cli.command('subject <id>', 'Get Subject').action(async (id, _options) => {
  const subject = await client.subject(+id);
  console.log(subject);
});

cli.command('search <keywords>', 'Search Subject').action(async (keywords, _options) => {
  const result = await client.search(keywords);
  console.log(result.list);
});

cli.run(process.argv.slice(2)).catch((err) => console.error(err));
