import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const revisions = sqliteTable('revisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  targetId: integer('target_id').notNull(),
  detail: text('detail', { mode: 'json' }).$type<unknown>().notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});
