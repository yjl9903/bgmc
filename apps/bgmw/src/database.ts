import type { DrizzleD1Database } from 'drizzle-orm/d1';

import { drizzle } from 'drizzle-orm/d1';

import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

const createDatabase = (database: D1Database) =>
  drizzle(database, {
    schema,
    logger: false
  });

let cachedDb: Database | undefined;

export const connectDatabase = async (database: D1Database) => {
  if (!cachedDb) {
    cachedDb = createDatabase(database);
  }
  return cachedDb;
};
