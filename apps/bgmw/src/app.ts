import { Hono } from 'hono';
import { logger } from 'hono/logger';

import type { AppEnv } from './env';

import { healthRoute } from './routes/health';
import { bangumiRoute } from './routes/bangumi';
import { connectDatabase } from './database';

export const createApp = () => {
  const app = new Hono<AppEnv>();

  app.use('*', logger());

  app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);

    const database = await connectDatabase(c.env.DATABASE);
    c.set('database', database);

    await next();

    c.res.headers.set('X-Request-Id', requestId);
  });

  app.route('/', healthRoute);
  app.route('/', bangumiRoute);

  app.notFound((c) => {
    return c.json(
      {
        ok: false,
        error: 'Not Found'
      },
      404
    );
  });

  app.onError((err, c) => {
    const requestId = c.get('requestId');

    console.error('[bgmw] unhandled error', err, { requestId });

    return c.json(
      {
        ok: false,
        error: 'Internal Server Error'
      },
      500
    );
  });

  return app;
};
