import { breadc } from 'breadc';

import { version } from '../package.json';

import { BgmClient } from './client';

const cli = breadc('bgmc', { version });

const client = new BgmClient(fetch);

cli.command('subject <id>', 'Get Subject').action(async (id, _options) => {
  const subject = await client.subject(+id);
  console.log(subject);
});

cli.command('person <id>', 'Get Person').action(async (id, _options) => {
  const person = await client.person(+id);
  console.log(person);
});

cli.command('search <keywords>', 'Search Subject').action(async (keywords, _options) => {
  const result = await client.search(keywords);
  console.log(result.list);
});

cli.run(process.argv.slice(2)).catch((err) => console.error(err));
