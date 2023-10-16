export type BangumiType = 'tv' | 'web' | 'movie' | 'ova';

export interface FullBangumi {
  id: number;

  name: string;

  alias: string[];

  summary: string;

  type: BangumiType;

  air_date: string;

  bangumi?: {
    id: number;

    name_cn: string;

    images: {
      small: string;
      grid: string;
      large: string;
      medium: string;
      common: string;
    };

    tags: string[];
  };

  tmdb?: {
    id: number;

    type: 'movie' | 'tv';

    name: string;

    original_name: string;

    overview: string;

    season?: number;

    first_episode?: number;

    poster_path: string;

    backdrop_path: string;
  };
}
