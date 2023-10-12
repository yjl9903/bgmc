import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { items, type Item } from 'bangumi-data';
import { BgmClient, SubjectInformation } from 'bgmc';

import { groupByBegin } from './utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataRoot = path.join(__dirname, '../../../data/bangumi');
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
  const client = new BgmClient(fetch);
  const bangumis: SubjectInformation[] = [];
  for (const item of items) {
    const bgm = item.sites.find((site) => site.site === 'bangumi');
    if (bgm) {
      const id = bgm.id;
      const subject = await client.subject(+id);
      bangumis.push(subject);
    } else {
      console.log(`Error: There is no bangumi id for ${item.title}`);
    }
  }
  await fs.writeFile(file, JSON.stringify(bangumis, null, 2));
}
