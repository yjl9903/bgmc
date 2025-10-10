import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const bangumis = sqliteTable('bangumis', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const tmdbs = sqliteTable('tmdbs', {
  id: integer('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

// export const subjects = sqliteTable('bangumis', {
//   id: integer('id')
//     .primaryKey()
//     .references(() => bangumis.id),
//   data: text('data', { mode: 'json' }).$type<unknown>().notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
//     .notNull()
//     .$defaultFn(() => new Date())
// });
