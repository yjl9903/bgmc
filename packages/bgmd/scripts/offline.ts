import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RelatedSubject, SubjectInformation } from 'bgmc';
import type { SearchTVResultItem, SearchMovieResultItem, SearchMultiResultItem } from 'tmdbc';

import { items, type Item } from 'bangumi-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DataRoot = path.join(__dirname, '../../../data');

export const BangumiDataRoot = path.join(DataRoot, 'bangumi');

export const TMDBDataRoot = path.join(DataRoot, 'tmdb');

export interface TMDBItem {
  title: string;

  bangumi: {
    id: string;
  };

  tmdb: {
    id: number;

    season?: number;

    search: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem;
  };
}

export interface BangumiItem {
  title: string;

  bangumi: SubjectInformation & { relations: RelatedSubject[] };
}

export class OfflineBangumi {
  private readonly root: string;

  private readonly map: Map<number, BangumiItem> = new Map();

  private readonly data: Map<number, Item> = new Map();

  public constructor() {
    this.root = BangumiDataRoot;
    for (const item of items) {
      const bgm = item.sites.find((site) => site.site === 'bangumi');
      if (bgm) {
        this.data.set(+bgm.id, item);
      }
    }
  }

  public async load() {
    const dirs = await fs.readdir(this.root);
    await Promise.all(
      dirs.map(async (dir) => {
        const files = await fs.readdir(path.join(this.root, dir));
        await Promise.all(
          files.map(async (file) => {
            const content = JSON.parse(
              await fs.readFile(path.join(this.root, dir, file), 'utf-8')
            ) as BangumiItem[];
            for (const item of content) {
              this.map.set(+item.bangumi.id, item);
            }
          })
        );
      })
    );
  }

  public entries() {
    return this.map.entries();
  }

  public keys() {
    return this.map.keys();
  }

  public values() {
    return this.map.values();
  }

  public [Symbol.iterator]() {
    return this.entries();
  }

  public get(item: Item) {
    const bgm = item.sites.find((site) => site.site === 'bangumi');
    if (bgm) {
      return this.map.get(+bgm.id);
    }
  }

  public getItem(bgm: BangumiItem) {
    return this.data.get(+bgm.bangumi.id);
  }

  public listPrequel(bgm: BangumiItem) {
    const res = new Set<BangumiItem>();
    const dfs = (bgm: BangumiItem) => {
      const related = bgm.bangumi.relations.filter((r) => ['前传'].includes(r.relation));
      for (const r of related) {
        const pre = this.map.get(+r.id);
        if (pre) {
          res.add(pre);
          dfs(pre);
        }
      }
    };
    dfs(bgm);
    return res;
  }
}
