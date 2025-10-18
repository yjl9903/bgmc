import { zValidator as originalZodValidator } from '@hono/zod-validator';

// @ts-ignore
export const zValidator: typeof originalZodValidator = (
  type: Parameters<typeof originalZodValidator>[0],
  schema: Parameters<typeof originalZodValidator>[1]
) => {
  return originalZodValidator(type, schema, (result, c) => {
    if (!result.success) {
      console.error('[bgmw]', 'zod validation error', result.error, result.data);

      return c.json({
        ok: false,
        timestamp: new Date(),
        error: result.error.name,
        issues: result.error.issues
      });
    }
  });
};
