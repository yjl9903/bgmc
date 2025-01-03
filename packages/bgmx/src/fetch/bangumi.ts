import fs from 'fs-extra';
import path from 'node:path';

import { items } from 'bangumi-data';
import { BgmClient } from 'bgmc';

import type { Context } from '../types';

import { groupByBegin } from '../utils';
import { BangumiRelations } from '../constants';
import { OfflineBangumi, type BangumiItem } from '../offline';

export async function fetchBangumiData(ctx: Context) {
  await fs.ensureDir(ctx.bangumiRoot);

  const client = new BgmClient(fetch);
  const bangumiDB = new OfflineBangumi(ctx.bangumiRoot);

  await bangumiDB.load();

  const taskIds = items
    .map((item) => {
      const bgm = item.sites.find((site) => site.site === 'bangumi');
      if (!bgm) {
        console.log(`Error: There is no bangumi id for ${item.title}`);
      }
      return { title: item.title, id: bgm?.id };
    })
    .filter((b) => !!b.id)
    .map((b) => ({ ...b, id: +b.id! }));

  for (const weekDay of await client.calendar()) {
    const calendar =
      weekDay?.items
        ?.map((bgm) => ({ title: bgm.name_cn || bgm.name || '', id: bgm.id }))
        .filter((b) => !!b.id)
        .map((b) => ({ ...b, id: +b.id! })) ?? [];
    taskIds.push(...calendar);
  }

  const ids = new Set();
  const bgms: BangumiItem[] = [];

  while (true) {
    let begin = bgms.length;
    const newTaskIds = [];

    for (const task of taskIds) {
      const bgmId = task.id;
      ids.add(bgmId);
      try {
        const bgm = await fetchSubject(bgmId, ctx);
        if (bgm) {
          bgms.push(bgm);
        }
      } catch (error) {
        console.log(`Error: fetch bangumi ${task.title} failed (id: ${bgmId})`);
      }
    }

    for (let i = begin; i < bgms.length; i++) {
      const bgm = bgms[i];
      try {
        for (const r of bgm.bangumi.relations) {
          if (BangumiRelations.includes(r.relation)) {
            if (!ids.has(r.id)) {
              newTaskIds.push({ title: r.name_cn || r.name, id: r.id });
            }
          }
        }
      } catch (error) {
        console.log(`Error: infer relations of ${bgm.title} (id: ${bgm.bangumi.id}) failed`);
      }
    }

    if (newTaskIds.length === 0) {
      break;
    }
    taskIds.splice(0, taskIds.length, ...newTaskIds);
  }

  const files = groupByBegin(bgms, (item) => item.date);
  for (const [year, yearData] of files) {
    const dir = path.join(ctx.bangumiRoot, '' + year);
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

  async function fetchSubject(bgmId: number, options: Context) {
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
      if (!options.overwrite) {
        console.log(`Info: fetch ${subject.name ?? item?.title} (id: ${subject.id})`);
      }

      return <BangumiItem>{
        title: subject.name ?? item?.title,
        date: subject.date ?? item?.begin,
        bangumi: {
          ...subject,
          tags: subject.tags?.map((t) => t.name).sort() ?? [],
          relations
        }
      };
    } else {
      console.log(`Error: fetch bangumi ${bgmId} failed`);
    }
  }
}
