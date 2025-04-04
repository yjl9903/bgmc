import fs from 'fs-extra';
import path from 'node:path';
import { JSDOM } from 'jsdom';

import { BgmClient, getSubjectAlias } from 'bgmc';

import type { Context } from '../types';

import { OfflineBangumi } from '../offline';
import { normalizeTitle, trimSeason } from 'bgmt';
import { YucRewriter } from '../rewrite';

export interface YucItem {
  id: number;

  name_cn: string;

  name_jp: string;

  cover: string | undefined;

  type: string;

  tags: string[];

  staff: Array<{ name: string; position: string }>;

  cast: Array<{ name: string }>;

  website: string;

  broadcast:
    | {
        // 开播日期
        start: { month: number; date: number };

        // 周几
        day?: number;

        // 上午 / 下午 / ...
        time?: string;
      }
    | undefined;
}

export interface YucCalendarItem {
  id: number;

  name: string;

  cover: string;
}

export async function fetchYucCalendar(
  ctx: Context,
  year?: number,
  month?: 1 | 4 | 7 | 10 | number
) {
  const root = path.join(ctx.root, 'yuc');
  await fs.ensureDir(root);
  await fs.ensureDir(ctx.bangumiRoot);

  const bangumiDB = new OfflineBangumi(ctx.bangumiRoot);
  const rewriter = new YucRewriter(ctx.root);

  const [ry, rm] = year && month ? [year, month] : inferOnairMonth();
  await Promise.all([bangumiDB.load(), rewriter.load(ry, rm)]);
  const matcher = createBangumiMatcher(bangumiDB, rewriter, ry, rm);

  const page = `${ry}${String(rm).padStart(2, '0')}`;
  const url = `https://yuc.wiki/${page}/`;
  const resp = await fetch(url);
  const html = await resp.text();
  const doc = new JSDOM(html);

  const items = extractAnime(doc.window.document);
  for (const item of items) {
    const result = matcher([item.name_cn, item.name_jp]);
    if (result) {
      item.id = result.bangumi.id;
      console.log(
        `Info: infer ${item.name_cn} -> ${result.bangumi.name_cn} (id: ${result.bangumi.id})`
      );
    } else {
      console.log(`Error: can not find ${item.name_cn} or ${item.name_jp}`);
    }
  }

  const { calendar, web } = extractCalendar(doc.window.document);
  const coverMap = new Map((await loadAll(root)).map((b) => [b.cover, b] as const));
  for (const item of [...calendar, web].flat()) {
    const bgm = coverMap.get(item.cover);
    if (bgm) {
      item.id = bgm.id;
    } else if (rewriter.getBangumiId(item.name)) {
      item.id = rewriter.getBangumiId(item.name)!;
    } else {
      const result = matcher([item.name]);
      if (result) {
        item.id = result.bangumi.id;
        console.log(
          `Info: infer ${item.name} -> ${result.bangumi.name_cn} (id: ${result.bangumi.id})`
        );
      } else {
        console.log(`Error: can not infer calendar bangumi ${item.name}`);
      }
    }
  }

  await fs.writeFile(
    path.join(root, `${page}.json`),
    JSON.stringify(
      { href: url, calendar, web, count: items.length, items: items.filter((t) => t.id) },
      null,
      2
    ),
    'utf-8'
  );
}

/**
 * Load all yuc JSON files
 *
 * @param root
 * @returns
 */
async function loadAll(root: string) {
  const files = await fs.readdir(root);
  const contents = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => fs.readFile(path.join(root, f), 'utf-8'))
  );
  return contents.map((c) => (JSON.parse(c) as any).items).flat() as YucItem[];
}

export function inferOnairMonth() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  switch (month) {
    case 1:
    case 2:
      return [year, 1];
    case 3:
    case 4:
    case 5:
      return [year, 4];
    case 6:
    case 7:
    case 8:
      return [year, 7];
    case 9:
    case 10:
    case 11:
      return [year, 10];
    case 12:
      return [year + 1, 1];
    default:
      throw new Error('unreachable');
  }
}

function extractAnime(doc: Document) {
  const tbodies = Array.from(doc.querySelectorAll('td.title_main_r')).map(
    (t) => t.parentElement!.parentElement!
  );
  const result: YucItem[] = [];
  for (const tbody of tbodies) {
    const container = tbody.parentElement?.parentElement;
    const cover = container?.previousElementSibling
      ?.querySelector('img')
      ?.getAttribute('data-src')
      ?.trim();
    const name_cn = tbody
      .querySelector('tr:first-child td.title_main_r p:nth-child(1)')
      ?.textContent?.trim();
    const name_jp = tbody
      .querySelector('tr:first-child td.title_main_r p:nth-child(2)')
      ?.textContent?.trim();
    const type = tbody
      .querySelector('tr:first-child td:nth-child(2)')
      ?.innerHTML?.replace(/<br>/g, ' ')
      ?.trim();
    const tags = parseTags(
      tbody.querySelector('tr:nth-child(2) td:first-child')?.textContent?.trim()
    );
    const staff = parseStaff(tbody.querySelector('tr:nth-child(3) td:nth-child(1)')?.innerHTML);
    const cast = parseCast(tbody.querySelector('tr:nth-child(3) td:nth-child(2)')?.innerHTML);
    const website = parseWebsite(
      tbody.querySelector('tr:nth-child(3) td:nth-child(3) a:first-child') as HTMLElement
    );
    const broadcast = parseBroadcast(
      tbody.querySelector('tr:nth-child(3) td:nth-child(3)') as HTMLElement
    );

    if (!name_cn || !name_jp || !type) {
      console.log('[ERROR] Find unknown yuc item', name_cn, name_jp);
      continue;
    }

    result.push({
      id: 0,
      name_cn,
      name_jp,
      cover: cover || undefined,
      type,
      tags,
      staff,
      cast,
      website,
      broadcast
    });
  }

  return result;
}

const DAY_MAP = new Map([
  ['周一', 0],
  ['周二', 1],
  ['周三', 2],
  ['周四', 3],
  ['周五', 4],
  ['周六', 5],
  ['周日', 6],
  ['周天', 6]
]);

function extractCalendar(doc: Document) {
  const calendar: YucCalendarItem[][] = [[], [], [], [], [], [], []];
  const web: YucCalendarItem[] = [];

  const wrappers = Array.from(doc.querySelectorAll('td.date2')).map(
    (t) => t.parentElement!.parentElement!.parentElement!.parentElement
  );
  for (const wrapper of wrappers) {
    const day = DAY_MAP.get(wrapper?.querySelector('.date2')?.textContent?.slice(0, 2) ?? '');
    const list = day !== undefined ? calendar[day] : web;

    const root = wrapper?.nextElementSibling;
    for (const dom of root?.children ?? []) {
      const title = dom
        .querySelector('table tbody tr:first-child td:first-child')
        ?.textContent?.trim();
      const cover = (
        dom.querySelector('.div_date img') || dom.querySelector('.div_date_ img')
      )?.getAttribute('data-src');

      if (!cover || !title) {
        console.log(`Error: unknown calendar item ${title}`, cover);
        continue;
      }

      list.push({ id: 0, name: title, cover });
    }
  }

  return { calendar, web };
}

function createBangumiMatcher(
  db: OfflineBangumi,
  rewriter: YucRewriter,
  year: number,
  month: number
) {
  const client = new BgmClient(fetch);
  const d1 = `${year}-${String(month).padStart(2, '0')}`;
  const d2 = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`;
  const d3 = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}`;
  const latest = [...db.values()].filter(
    (bgm) => bgm.date.startsWith(d1) || bgm.date.startsWith(d2) || bgm.date.startsWith(d3)
  );

  return (names: string[]) => {
    const set = new Set(names.map((t) => rewriter.rename(t)).map(normalizeTitle));
    // Match trimmed season
    const { original } = trimSeason({
      name: names[0],
      alias: names
    });
    const has = (t: string) => set.has(t);
    const prefix = (t: string) => names.some((n) => t.startsWith(n));
    const trimmed =
      original && original.length
        ? (t: string) => original.some((n) => t.startsWith(n))
        : undefined;

    for (const check of [has, prefix, ...(trimmed ? [trimmed] : [])]) {
      for (const bgm of latest) {
        if (
          check(normalizeTitle(bgm.title)) ||
          check(normalizeTitle(bgm.bangumi.name)) ||
          check(normalizeTitle(bgm.bangumi.name_cn))
        ) {
          return bgm;
        }
        // Match alias
        const alias = new Set(
          [...getSubjectAlias(bgm.bangumi)].map(decodeName).map(normalizeTitle)
        );
        if ([...alias].some((a) => check(a))) {
          return bgm;
        }
      }
    }
  };
}

function parseTags(text?: string) {
  if (!text) return [];
  return text
    .split('/')
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseStaff(text?: string) {
  if (!text) return [];
  const staff: Array<{ name: string; position: string }> = [];
  const lines = text
    .split('<br>')
    .map((t) => decodeName(stripHtmlTags(t.trim())))
    .filter(Boolean);
  let pos = '';
  for (const line of lines) {
    const [key, value] = line.split(/:|：/).map((t) => t.trim());
    if (key && value) {
      pos = key;
      staff.push({ position: key, name: value });
    } else if (key) {
      staff.push({ position: pos, name: key });
    }
  }
  return staff;
}

function parseCast(text?: string) {
  if (!text) return [];
  const lines = text
    .split('<br>')
    .map((t) => decodeName(stripHtmlTags(t.trim())))
    .filter(Boolean)
    .map((t) => t.split('　'))
    .flat()
    .map((t) => t.trim())
    .filter(Boolean);
  return lines.map((t) => ({ name: t }));
}

function parseWebsite(dom?: HTMLElement) {
  if (dom?.textContent?.includes('官网')) {
    return dom.getAttribute('href') || '';
  }
  return '';
}

function parseBroadcast(dom?: HTMLElement) {
  if (!dom) return undefined;
  const b1 = dom.querySelector('p.broadcast_r')?.textContent?.trim();
  // const b2 = dom.querySelector('p.broadcast_ex_r');
  if (b1) {
    const RE_START = /(\d+)\/(\d+)/;
    const RE_DAY = /周[一二三四五六日天]../;
    const start = RE_START.exec(b1);
    if (start) {
      const bstart = { month: +start[1], date: +start[2] };
      const day = RE_DAY.exec(b1);
      if (day) {
        const d1 = day[0].slice(0, 2);
        const d2 = day[0].slice(2, 4);
        return { start: bstart, day: DAY_MAP.get(d1), time: d2 };
      } else {
        return { start: bstart, day: undefined, time: undefined };
      }
    }
  }
  return undefined;
}

function stripHtmlTags(input: string) {
  return input.replace(/^<[^>]+>|<[^>]+>$/g, '');
}

function decodeName(name: string) {
  return name
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
