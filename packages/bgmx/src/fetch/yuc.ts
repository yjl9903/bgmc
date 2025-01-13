import fs from 'fs-extra';
import path from 'node:path';
import { JSDOM } from 'jsdom';

import { BgmClient } from 'bgmc';

import type { Context } from '../types';

import { OfflineBangumi } from '../offline';

export interface YucItem {
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

export async function fetchYucCalendar(
  ctx: Context,
  year?: number,
  month?: 1 | 4 | 7 | 10 | number
) {
  await fs.ensureDir(ctx.bangumiRoot);

  const client = new BgmClient(fetch);
  const bangumiDB = new OfflineBangumi(ctx.bangumiRoot);

  await bangumiDB.load();

  const page = year && month ? `${year}${String(month).padStart(2, '0')}` : inferOnairMonth();
  const url = `https://yuc.wiki/${page}/`;
  const resp = await fetch(url);
  const html = await resp.text();
  const doc = new JSDOM(html);

  const items = extractAnime(doc.window.document);

  const root = path.join(ctx.root, 'yuc');
  await fs.ensureDir(root);
  await fs.writeFile(
    path.join(root, `${page}.json`),
    JSON.stringify({ href: url, count: items.length, items }, null, 2),
    'utf-8'
  );
}

export function inferOnairMonth() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  switch (month) {
    case 1:
    case 2:
      return year + '01';
    case 3:
    case 4:
    case 5:
      return year + '04';
    case 6:
    case 7:
    case 8:
      return year + '07';
    case 9:
    case 10:
    case 11:
      return year + '10';
    case 12:
      return year + 1 + '01';
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
