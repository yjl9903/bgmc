import { Hono } from 'hono';
import { BgmClient, BgmFetchError } from 'bgmc';

import type { AppEnv } from '../env';

const router = new Hono<AppEnv>();

const client = new BgmClient((...args) => globalThis.fetch(...args));

router.get('/bangumi/subject/:id', async (c) => {
  const timestamp = new Date();
  const requestId = c.get('requestId');
  const idParam = c.req.param('id');
  const subjectId = Number.parseInt(idParam, 10);

  if (!Number.isFinite(subjectId) || subjectId <= 0) {
    return c.json(
      {
        ok: false,
        error: 'Invalid subject id'
      },
      400,
      {
        'X-Request-Id': requestId
      }
    );
  }

  try {
    const data = await client.subject(subjectId);

    return c.json(
      {
        ok: true,
        data,
        timestamp
      },
      200,
      {
        'X-Request-Id': requestId
      }
    );
  } catch (error) {
    if (error instanceof BgmFetchError && error.response.status === 404) {
      return c.json(
        {
          ok: false,
          error: 'Subject not found'
        },
        404,
        {
          'X-Request-Id': requestId
        }
      );
    }

    console.error('[bgmw] failed to fetch subject', error, {
      requestId,
      subjectId
    });

    return c.json(
      {
        ok: false,
        error: 'Failed to fetch subject'
      },
      502,
      {
        'X-Request-Id': requestId
      }
    );
  }
});

export const bangumiRoute = router;
