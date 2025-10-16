import { Hono } from 'hono';

import type { AppEnv } from '../env';

const router = new Hono<AppEnv>();

router.get('/health', (c) => {
  return c.json(
    {
      ok: true,
      timestamp: new Date()
    },
    200
  );
});

export const healthRoute = router;
