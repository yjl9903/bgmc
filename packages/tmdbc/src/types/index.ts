interface SearchQuery {
  query: string;

  first_air_date_year?: string;

  include_adult?: boolean;

  language?: string;

  page?: number;

  year?: number | string;
}

export interface SearchTVQuery extends SearchQuery {}

export interface SearchMovieQuery extends SearchQuery {
  primary_release_year?: number | string;

  region?: string;
}

export interface SearchResult<T> {
  page: number;

  results: T[];

  total_pages: number;

  total_results: number;
}

export interface SearchResultItem {
  adult: boolean;

  backdrop_path: string;

  genre_ids: number[];

  id: number;

  origin_country: string[];

  original_language: string;

  original_name: string;

  overview: string;

  popularity: number;

  poster_path: string;

  first_air_date: string;

  name: string;

  vote_average: number;

  vote_count: number;
}
