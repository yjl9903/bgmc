import fs from 'fs-extra';
import path from 'node:path';

import type { RelatedSubject, SubjectInformation } from 'bgmc';
import type { SearchTVResultItem, SearchMovieResultItem, SearchMultiResultItem } from 'tmdbc';

import { items, type Item } from 'bangumi-data';

import { BangumiRelations, SeasonSuffix } from './constants';

export interface TMDBItem {
  title: string;

  date: string;

  bangumi: {
    id: string;
  };

  tmdb: {
    id: number;

    type: 'tv' | 'movie' | string;

    season?: number;

    first_episode?: number;

    search: Omit<
      SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem,
      'popularity' | 'vote_average' | 'vote_count'
    >;
  };
}

export interface BangumiItem {
  title: string;

  date: string;

  bangumi: Omit<SubjectInformation, 'rating' | 'collection' | 'tags'> & {
    tags: string[];
    relations: RelatedSubject[];
  };
}

export class OfflineBangumi {
  private readonly root: string;

  private readonly map: Map<number, BangumiItem> = new Map();

  private readonly data: Map<number, Item> = new Map();

  public constructor(root: string) {
    this.root = root;
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

  public getById(id: number | string) {
    return this.map.get(+id);
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

  public getItemById(id: number | string) {
    return this.data.get(+id);
  }

  public listPrequel(bgm: BangumiItem) {
    const res = new Set<BangumiItem>();
    const dfs = (bgm: BangumiItem) => {
      if (!Array.isArray(bgm.bangumi.relations)) {
        console.log(`Error: ${bgm.title} (id: ${bgm.bangumi.id}) does not have relations`);
        return;
      }

      const related = (bgm.bangumi.relations ?? []).filter((r) =>
        BangumiRelations.includes(r.relation)
      );
      for (const r of related) {
        const pre = this.map.get(+r.id);
        if (pre && !res.has(pre)) {
          res.add(pre);
          dfs(pre);
        }
      }
    };
    dfs(bgm);

    return new Set([bgm, ...res].flatMap((r) => trimEnd(r.title)).map((t) => t.trim()));

    function trimEnd(name: string) {
      for (const suffix of SeasonSuffix) {
        if (suffix.test(name)) {
          return [name, name.replace(suffix, '')];
        }
      }
      return [name];
    }
  }
}

export class OfflineTMDB {
  private readonly root: string;

  private readonly map: Map<number, TMDBItem> = new Map();

  private readonly data: Map<number, Item> = new Map();

  public constructor(root: string) {
    this.root = root;
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
            ) as TMDBItem[];
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

  public getById(id: number | string) {
    return this.map.get(+id);
  }
}
