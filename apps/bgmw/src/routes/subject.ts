import { z } from 'zod';
import { asc, gt } from 'drizzle-orm';
import { Hono } from 'hono';

import type { AppEnv } from '../env';

import { subjects } from '../schema/subject';

import { zValidator } from './middlewares/zod';

const router = new Hono<AppEnv>();

// 查询数据库中的单个 subject
router.get(
  '/subject/:id',
  zValidator('param', z.object({ id: z.coerce.number().int().gt(0) })),
  async (c) => {
    const timestamp = new Date();
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;

    try {
      const database = c.get('database');
      const subject = await database.query.subjects.findFirst({
        where: (table, { eq }) => eq(table.id, subjectId)
      });

      if (!subject) {
        return c.json(
          {
            ok: false,
            timestamp,
            error: 'Subject not found'
          },
          404
        );
      }

      return c.json(
        {
          ok: true,
          timestamp,
          data: subject
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to fetch subject', error, {
        requestId,
        subjectId
      });

      return c.json(
        {
          ok: false,
          timestamp,
          error: 'Failed to fetch subject'
        },
        502
      );
    }
  }
);

// 游标方式查询 subject 列表
router.get(
  '/subjects',
  zValidator(
    'query',
    z.object({
      cursor: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().positive().max(1000).default(100)
    })
  ),
  async (c) => {
    const timestamp = new Date();
    const requestId = c.get('requestId');

    try {
      const { cursor, limit } = c.req.valid('query');

      const database = c.get('database');
      const data = await database
        .select()
        .from(subjects)
        .where(gt(subjects.id, cursor))
        .orderBy(asc(subjects.id))
        .limit(limit);

      const nextCursor =
        data.length === limit && data.length > 0 ? (data[data.length - 1]?.id ?? null) : null;

      return c.json(
        {
          ok: true,
          timestamp,
          data,
          nextCursor
        },
        200
      );
    } catch (error) {
      console.error('[bgmw] failed to fetch subjects', error, { requestId });

      return c.json(
        {
          ok: false,
          timestamp,
          error: 'Failed to fetch subject list'
        },
        502
      );
    }
  }
);

export const subjectRoute = router;
