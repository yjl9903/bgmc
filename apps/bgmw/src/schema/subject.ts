import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

import type { RelatedSubject, SubjectCharacters, SubjectInformation, SubjectPersons } from 'bgmc';

export const bangumis = sqliteTable('bangumis', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<SubjectInformation>().notNull(),
  persons: text('persons', { mode: 'json' }).$type<SubjectPersons>().notNull(),
  characters: text('characters', { mode: 'json' }).$type<SubjectCharacters>().notNull(),
  subjects: text('subjects', { mode: 'json' }).$type<RelatedSubject[]>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export type Bangumi = typeof bangumis.$inferSelect;

export const tmdbs = sqliteTable('tmdbs', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const subjects = sqliteTable('subjects', {
  id: integer('id')
    .primaryKey()
    .references(() => bangumis.id),
  title: text('title').notNull(),
  bangumi: text('bangumi', { mode: 'json' }).$type<unknown>().notNull(),
  keywords: text('keywords', { mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const calendar = sqliteTable('calendars', {
  id: integer('id')
    .primaryKey()
    .references(() => subjects.id),
  weekday: integer('weekday').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  onairAt: integer('onair_at', { mode: 'timestamp' }).notNull()
});
