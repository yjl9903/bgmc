import type { LanguageQuery } from './common';

export interface SearchQuery extends LanguageQuery {
  query: string;

  include_adult?: boolean;

  page?: number;
}

export interface SearchTVQuery extends SearchQuery {
  first_air_date_year?: string;

  year?: number | string;
}

export interface SearchMovieQuery extends SearchTVQuery {
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

  id: number;

  original_language: string;

  overview: string;

  popularity: number;

  poster_path: string;

  vote_average: number;

  vote_count: number;
}

export interface SearchTVResultItem extends SearchResultItem {
  genre_ids: number[];

  origin_country: string[];

  original_name: string;

  first_air_date: string;

  name: string;
}

export interface SearchMovieResultItem extends SearchResultItem {
  genre_ids: number[];

  original_title: string;

  title: string;

  release_date: string;
}

export interface SearchMultiResultItem extends SearchMovieResultItem {}
