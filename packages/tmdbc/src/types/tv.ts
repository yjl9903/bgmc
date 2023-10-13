export interface TVDetail {
  id: number;

  languages: string[];

  name: string;

  number_of_episodes: number;

  number_of_seasons: number;

  origin_country: string[];

  original_language: string;

  original_name: string;

  overview: string;

  seasons: TVSeasonOverview[];
}

export interface TVSeasonOverview {
  air_date: string;

  episode_count: number;

  id: number;

  name: string;

  overview: string;

  poster_path: string;

  season_number: number;
}

export interface TVSeasonDetail {
  _id: string;

  air_date: string;

  episodes: TVSeasonEpisodeOverview[];

  name: string;

  overview: string;

  id: number;

  poster_path: string;

  season_number: number;
}

export interface TVSeasonEpisodeOverview {
  air_date: string;

  episode_number: number;

  id: number;

  name: string;

  overview: string;

  season_number: number;
}

export interface TVEpisodeDetail {}
