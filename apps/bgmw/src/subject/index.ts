import { eq } from 'drizzle-orm';

import type { Context } from '../env';
import { type Bangumi as DatabaseBangumi, subjects as subjectsSchema } from '../schema';

import { deepEqual } from './utils';
import { createDatabaseSubject } from './subject';

export async function updateSubject(ctx: Context, bangumi: DatabaseBangumi) {
  const database = ctx.get('database');

  const revisions = await database.query.revisions.findMany({
    where: (t) => eq(t.targetId, bangumi.id)
  });

  const subject = createDatabaseSubject(bangumi, revisions);

  const dbSubject = await database.query.subjects
    .findFirst({
      where: (t) => eq(t.id, bangumi.id)
    })
    .catch(() => undefined);

  if (dbSubject) {
    // 使用深度比较检查是否需要更新
    const dirty =
      dbSubject.title !== subject.title ||
      !deepEqual(dbSubject.search, subject.search) ||
      !deepEqual(dbSubject.data, subject.data);

    if (dirty) {
      const resp = await database
        .update(subjectsSchema)
        .set({
          title: subject.title,
          data: subject.data,
          search: subject.search
        })
        .where(eq(subjectsSchema.id, bangumi.id))
        .returning({ id: subjectsSchema.id });

      return {
        ok: resp.length > 0 && resp[0]?.id === subject.id ? true : false,
        data: subject
      };
    } else {
      return {
        ok: false,
        data: dbSubject
      };
    }
  } else {
    const resp = await database
      .insert(subjectsSchema)
      .values(subject)
      .onConflictDoUpdate({
        target: subjectsSchema.id,
        set: {
          title: subject.title,
          data: subject.data,
          search: subject.search
        }
      })
      .returning({ id: subjectsSchema.id });

    return {
      ok: resp.length > 0 && resp[0]?.id === subject.id ? true : false,
      data: subject
    };
  }
}
