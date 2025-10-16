import type { MiddlewareHandler } from 'hono';

import type { AppEnv } from '../../env';

const unauthorizedResponse = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => {
  const requestId = c.get('requestId');

  return c.json(
    {
      ok: false,
      error: 'Unauthorized'
    },
    401,
    {
      'X-Request-Id': requestId
    }
  );
};

export const authorization: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authorization = c.req.header('Authorization');
  const secret = c.env.SECRET;

  if (!secret) {
    console.error('[bgmw] missing auth secret');
    return unauthorizedResponse(c);
  }

  if (!authorization) {
    return unauthorizedResponse(c);
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || token !== secret) {
    return unauthorizedResponse(c);
  }

  await next();
};
