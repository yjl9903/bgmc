import fs from 'fs-extra';
import path from 'node:path';

export class YucRewriter {
  public readonly root: string;

  public readonly names: Map<string, string> = new Map();

  public constructor(root: string) {
    this.root = path.join(root, 'rewrite-yuc.json');
  }

  public async load(year: number, month: number) {
    const all = JSON.parse(await fs.readFile(this.root, 'utf-8')) as any;
    const data = all[`${year}${String(month).padStart(2, '0')}`] ?? {};
    for (const [key, value] of Object.entries(data.names ?? {})) {
      this.names.set(key, value as string);
    }
  }

  public rename(title: string) {
    return this.names.get(title) || title;
  }
}
