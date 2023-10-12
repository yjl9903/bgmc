import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RelatedSubject, SubjectInformation } from 'bgmc';
import type { SearchTVResultItem, SearchMovieResultItem, SearchMultiResultItem } from 'tmdbc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DataRoot = path.join(__dirname, '../../../data');

export const BangumiDataRoot = path.join(DataRoot, 'bangumi');

export const TMDBDataRoot = path.join(DataRoot, 'bangumi');

export interface TMDBItem {
  title: string;

  bangumi: {
    id: string;
  };

  tmdb: SearchTVResultItem | SearchMovieResultItem | SearchMultiResultItem;
}

export interface BangumiItem {
  title: string;

  bangumi: SubjectInformation & { relations: RelatedSubject[] };
}
