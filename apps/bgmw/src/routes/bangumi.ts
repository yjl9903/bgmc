import { z } from 'zod';
import { Hono } from 'hono';

import { BgmFetchError } from 'bgmc';

import type { AppEnv } from '../env';

import { client, fetchAndUpdateBangumiSubject } from '../bangumi';

import { zValidator } from './middlewares/zod';
import { authorization } from './middlewares/auth';

const router = new Hono<AppEnv>();

// 查询 bangumi calendar
router.get('/bangumi/calendar', async (c) => {
  const timestamp = new Date();
  const calendar = await client.calendar();

  return c.json({
    ok: true,
    timestamp,
    data: calendar
  });
});

// 查询 bangumi subject
router.get(
  '/bangumi/subject/:id',
  zValidator('param', z.object({ id: z.coerce.number().gt(0) })),
  async (c) => {
    const timestamp = new Date();
    const requestId = c.get('requestId');
    const subjectId = c.req.valid('param').id;

    try {
      const data = await client.subject(subjectId);

      return c.json(
        {
          ok: true,
          timestamp,
          data
        },
        200
      );
    } catch (error) {
      if (error instanceof BgmFetchError && error.response.status === 404) {
        return c.json(
          {
            ok: false,
            timestamp,
            error: 'Subject not found'
          },
          404
        );
      }

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

// 提交更新 bangumi subject
router.post(
  '/bangumi/subject/:id',
  authorization,
  zValidator('param', z.object({ id: z.coerce.number().gt(0) })),
  async (c) => {
    const subjectId = c.req.valid('param').id;

    const resp = await fetchAndUpdateBangumiSubject(c, subjectId);

    return c.json(resp);
  }
);

export const bangumiRoute = router;
