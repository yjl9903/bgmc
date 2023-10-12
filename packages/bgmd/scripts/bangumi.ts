import fs from 'fs-extra';
import path from 'node:path';

import { BgmClient } from 'bgmc';
import { items, type Item } from 'bangumi-data';

import { groupByBegin } from './utils';
import { BangumiDataRoot, type BangumiItem } from './offline';

await fs.ensureDir(BangumiDataRoot);

const files = groupByBegin(items);
for (const [year, yearData] of files) {
  const dir = path.join(BangumiDataRoot, '' + year);
  await fs.ensureDir(dir);
  for (const [month, monthData] of yearData) {
    const file = path.join(dir, `${String(month).padStart(2, '0')}.json`);
    await downloadSubject(file, monthData);
  }
}

async function downloadSubject(file: string, items: Item[]) {
  const client = new BgmClient(fetch);
  const bangumis: BangumiItem[] = [];
  for (const item of items) {
    const bgm = item.sites.find((site) => site.site === 'bangumi');
    if (bgm) {
      const id = bgm.id;
      const subject = await client.subject(+id);
      bangumis.push({
        title: item.title,
        bangumi: {
          ...subject,
          relations: await client.subjectRelated(+id)
        }
      });
    } else {
      console.log(`Error: There is no bangumi id for ${item.title}`);
    }
  }
  await fs.writeFile(file, JSON.stringify(bangumis, null, 2));
}
