import 'dotenv/config';

import pLimit from 'p-limit';
import { breadc } from 'breadc';
import { consola } from 'consola';
import bangumiData from 'bangumi-data' with { type: 'json' };

import { getSubjectDisplayName } from 'bgmt';

import { version } from '../package.json';

import { dumpDataBy, printBangumiSubject, printSubject } from './commands';
import { type DatabaseBangumi, fetchAndUpdateBangumiSubject, fetchBangumiSubjects } from './client';
import { fetchSubject } from './client/subject';

const cli = breadc('bgmx', { version }).option('-s, --secret <string>', 'API 密钥');

cli
  .command('sync subject', '拉取所有 bgmx 条目数据')
  .option('--update', '是否更新数据, 默认值: true', { default: true })
  .option('--log <file>', '日志文件, 默认值: sync-subject.md')
  .option('--out-dir <directory>', '输出目录, 默认值: data/subject')
  .option('--concurrency <number>', '并发数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .option('--retry <number>', '重试次数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.update) {
      consola.warn('未提供 API 密钥，将无法更新数据');
    }
  });

cli
  .command('sync bangumi', '拉取并更新所有 bangumi 条目数据')
  .option('--update', '是否更新数据, 默认值: true', { default: true })
  .option('--log <file>', '日志文件, 默认值: sync-bangumi.md')
  .option('--out-dir <directory>', '输出目录, 默认值: data/bangumi')
  .option('--concurrency <number>', '并发数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .option('--retry <number>', '重试次数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.update) {
      consola.warn('未提供 API 密钥，将无法更新数据');
    }

    const executing = new Set<number>();
    const updated = new Map<number, DatabaseBangumi>();
    const unknown: typeof bangumiData.items = [];
    const errors = new Map<number, any>();

    const limit = pLimit(options.concurrency);
    const tasks: Promise<DatabaseBangumi | undefined>[] = [];

    const doUpdate = async (bgmId: number) => {
      try {
        const resp = await fetchAndUpdateBangumiSubject(bgmId, { secret });

        updated.set(bgmId, resp);
        errors.delete(bgmId);

        return resp;
      } catch (error) {
        console.error(`更新 ${bgmId} 失败:`, error);

        executing.delete(bgmId);
        errors.set(bgmId, error);

        return undefined;
      }
    };

    // 1. 更新服务端的所有 bangumi 条目
    for await (const subject of fetchBangumiSubjects()) {
      console.info(`${getSubjectDisplayName(subject.data)} (id: ${subject.id})`);

      executing.add(subject.id);

      if (options.update && secret) {
        tasks.push(limit(() => doUpdate(subject.id)));
      } else {
        updated.set(subject.id, subject);
      }
    }

    await Promise.all(tasks);

    // 2. 更新 bangumi-data 出现的条目
    for (const item of bangumiData.items) {
      const bgmId = item.sites.find((site) => site.site === 'bangumi')?.id;
      if (bgmId) {
        if (!executing.has(+bgmId)) {
          console.info(`${item.title} (id: ${bgmId})`);

          executing.add(+bgmId);

          if (options.update && secret) {
            tasks.push(limit(() => doUpdate(+bgmId)));
          }
        }
      } else {
        console.error(`缺失 bangumi 信息:`, item.title);
        unknown.push(item);
      }
    }

    await Promise.all(tasks);

    // 3. 重试
    for (let turn = 0; turn < options.retry && errors.size > 0; turn++) {
      for (const bgmId of errors.keys()) {
        tasks.push(limit(() => doUpdate(bgmId)));
      }
      await Promise.all(tasks);
    }

    // 4. 数据持久化
    const bangumis = [...updated.values()];
    await dumpDataBy(
      options.outDir ?? 'data/bangumi',
      bangumis,
      (item) => {
        const date = item.data.date;
        if (date) {
          const [year, month] = date.split('-');
          return `${year}/${month}`;
        } else {
          return 'tbd';
        }
      },
      (a, b) => a.id - b.id
    );

    // 5. 写入错误日志
    {
      const logFile = options.log ?? 'sync-bangumi.md';
      const content: string[] = [];

      content.push('## bgmx fetch bangumi');
      content.push(``);
      if (unknown.length > 0) {
        content.push(`### bangumi-data`);
        content.push(``);
        for (const item of unknown) {
          content.push(`- 缺失 bangumi 信息: ${item.title}`);
        }
        content.push(``);
      }
      if (errors.size > 0) {
        content.push(`### 更新错误`);
        content.push(``);
        for (const [bgmId, error] of errors) {
          content.push(`- 更新失败 ${bgmId} : ${error.message}`);
        }
        content.push(``);
      }

      const { writeFile } = await import('node:fs/promises');
      await writeFile(logFile, content.join('\n'), 'utf-8');
    }

    if (options.update) {
      console.info(`更新结束, 成功更新 ${updated.size} 条，失败 ${errors.size} 条`);
    } else {
      console.info(`成功拉取 ${updated.size} 条数据`);
    }
  });

cli
  .command('sync tmdb', '拉取并更新所有 tmdb 条目数据')
  .option('--update', '是否更新数据, 默认值: true', { default: true })
  .option('--log <file>', '日志文件, 默认值: sync-tmdb.md')
  .option('--out-dir <directory>', '输出目录, 默认值: data/tmdb')
  .option('--concurrency <number>', '并发数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .option('--retry <number>', '重试次数, 默认值: 3', { cast: (v) => (v ? +v : 3) })
  .action(async (options) => {
    const secret = options.secret ?? process.env.SECRET;
    if (!secret && options.update) {
      consola.warn('未提供 API 密钥，将无法更新数据');
    }
  });

cli.command('subject <id>', '查询 bgmx 条目').action(async (id, options) => {
  const secret = options.secret ?? process.env.SECRET;

  const resp = await fetchSubject(+id, {
    secret
  });

  printSubject(resp);
});

cli.command('bangumi subject <id>', '查询并更新 bangumi 条目').action(async (id, options) => {
  const secret = options.secret ?? process.env.SECRET;

  const resp = await fetchAndUpdateBangumiSubject(+id, {
    secret
  });

  printBangumiSubject(resp);
});

if (process.stdin.isTTY) {
  consola.wrapConsole();
}

await cli.run(process.argv.slice(2)).catch((err) => console.error(err));
