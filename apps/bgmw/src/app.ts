import { Hono } from 'hono';
import { logger } from 'hono/logger';

import type { AppEnv } from './env';

import { healthRoute } from './routes/health';

export const createApp = () => {
  const app = new Hono<AppEnv>();

  app.use('*', logger());

  app.use('*', async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    c.set('executionContext', c.executionCtx);

    await next();
  });

  app.route('/', healthRoute);

  app.notFound((c) => {
    const requestId = c.get('requestId');

    return c.json(
      {
        ok: false,
        error: 'Not Found'
      },
      404,
      {
        'x-request-id': requestId
      }
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
      500,
      {
        'x-request-id': requestId
      }
    );
  });

  return app;
};
