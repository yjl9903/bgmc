import fs from 'fs-extra';
import path from 'node:path';
import { JSDOM } from 'jsdom';

import type { Context } from '../types';

export interface YucItem {
  name_cn: string;

  name_jp: string;

  cover: string | undefined;
}

export async function fetchYucCalendar(ctx: Context) {
  const page = inferOnairMonth();
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

function extractAnime(doc: Document) {
  const tbodies = Array.from(doc.querySelectorAll('td.title_main_r')).map(
    (t) => t.parentElement!.parentElement!
  );
  const result: YucItem[] = [];
  for (const tbody of tbodies) {
    const container = tbody.parentElement?.parentElement;
    const cover = container?.previousElementSibling?.querySelector('img')?.getAttribute('data-src');
    const name_cn = tbody.querySelector(
      'tr:first-child td.title_main_r p:nth-child(1)'
    )?.textContent;
    const name_jp = tbody.querySelector(
      'tr:first-child td.title_main_r p:nth-child(2)'
    )?.textContent;

    if (!name_cn || !name_jp) {
      console.log('[ERROR] Find unknown yuc item');
      continue;
    }

    result.push({
      name_cn,
      name_jp,
      cover: cover || undefined
    });
  }
  return result;
}

function inferOnairMonth() {
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
