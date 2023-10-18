import fs from 'fs-extra';
import path from 'node:path';

import { items } from 'bangumi-data';
import { breadc } from 'breadc';
import { BgmClient } from 'bgmc';

import { groupByBegin } from './utils';
import { BangumiRelations } from './constants';
import { BangumiDataRoot, OfflineBangumi, type BangumiItem } from './offline';

await fs.ensureDir(BangumiDataRoot);

const client = new BgmClient(fetch);
const bangumiDB = new OfflineBangumi();

interface Options {
  overwrite: boolean;
}

async function main(options: Options = { overwrite: true }) {
  await bangumiDB.load();

  const taskIds = items
    .map((item) => {
      const bgm = item.sites.find((site) => site.site === 'bangumi');
      if (!bgm) {
        console.log(`Error: There is no bangumi id for ${item.title}`);
      }
      return bgm?.id;
    })
    .filter(Boolean)
    .map((id) => +id!) as number[];

  for (const weekDay of await client.calendar()) {
    taskIds.push(...((weekDay?.items?.map((bgm) => bgm.id).filter(Boolean) as number[]) ?? []));
  }

  const ids = new Set(taskIds);
  const bgms: BangumiItem[] = [];

  while (true) {
    let begin = bgms.length;
    const newTaskIds: number[] = [];

    for (const bgmId of taskIds) {
      ids.add(bgmId);
      const bgm = await fetchSubject(bgmId, options);
      if (bgm) {
        bgms.push(bgm);
      }
    }

    for (let i = begin; i < bgms.length; i++) {
      const bgm = bgms[i];
      try {
        for (const r of bgm.bangumi.relations) {
          if (BangumiRelations.includes(r.relation)) {
            if (!ids.has(r.id)) {
              newTaskIds.push(r.id);
            }
          }
        }
      } catch (error) {
        console.log(`Error: fetch ${bgm.title} (id: ${bgm.bangumi.id}) failed`);
      }
    }

    if (newTaskIds.length === 0) {
      break;
    }
    taskIds.splice(0, taskIds.length, ...newTaskIds);
  }

  const files = groupByBegin(bgms, (item) => (item.date ? new Date(item.date) : undefined));
  for (const [year, yearData] of files) {
    const dir = path.join(BangumiDataRoot, '' + year);
    await fs.ensureDir(dir);
    for (const [month, monthData] of yearData) {
      const file = path.join(dir, `${String(month).padStart(2, '0')}.json`);

      await fs.writeFile(
        file,
        JSON.stringify(
          monthData.map((bgm) => {
            Reflect.deleteProperty(bgm.bangumi, 'rating');
            Reflect.deleteProperty(bgm.bangumi, 'collection');
            return bgm;
          }),
          null,
          2
        )
      );
    }
  }
}

async function fetchSubject(bgmId: number, options: Options) {
  if (!options.overwrite) {
    if (bangumiDB.getById(bgmId)) {
      return bangumiDB.getById(bgmId)!;
    }
  }

  const item = bangumiDB.getItemById(bgmId);
  const [subject, relations] = await Promise.all([
    client.subject(bgmId),
    client.subjectRelated(bgmId)
  ]);

  if (subject) {
    return <BangumiItem>{
      title: item?.title ?? subject.name,
      date: item?.begin ?? subject.date,
      bangumi: {
        ...subject,
        tags: subject.tags?.map((t) => t.name) ?? [],
        relations
      }
    };
  } else {
    console.log(`Error: fetch bangumi ${bgmId} failed`);
  }
}

const cli = breadc('tmdb');

cli
  .command('')
  .option('--overwrite')
  .action(async (options) => {
    await main(options);
  });

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
