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
