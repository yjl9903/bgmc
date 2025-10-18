import { retryFn, sleep } from '../utils';

import type { FetchOptions } from './types';

export const DefaultBaseURL = 'https://bgm.animes.garden/';

export async function fetchAPI<T>(
  path: string,
  init: RequestInit | undefined = undefined,
  options: FetchOptions = {}
): Promise<T> {
  const { baseURL = DefaultBaseURL, retry = 0 } = options;

  const url = new URL(path.replace(/^\/+/g, ''), baseURL);

  return await retryFn<T>(
    async () => {
      const signal =
        options.timeout && options.timeout > 0
          ? options.signal
            ? AbortSignal.any([AbortSignal.timeout(options.timeout), options.signal])
            : AbortSignal.timeout(options.timeout)
          : options.signal;

      // @ts-ignore
      const headers = new Headers(options.headers);
      if (options.secret) {
        headers.set('Authorization', `Bearer ${options.secret}`);
      }

      const payload = {
        ...init,
        headers,
        signal
      };

      if (options?.hooks?.prefetch) {
        await options.hooks.prefetch(url.toString(), payload);
      }

      let error: any;
      const resp = await (options.fetch ?? globalThis.fetch)(url.toString(), payload).catch(
        (_error: any) => {
          error = _error;
          return undefined;
        }
      );

      if (resp) {
        if (options?.hooks?.postfetch) {
          await options.hooks.postfetch(url.toString(), payload, resp);
        }

        if (resp.ok) {
          return (await resp.json()) as T;
        } else {
          // 429 TOO MANY REQUEST
          if (resp.status === 429) {
            await sleep(16 * 1000);
          }

          const json = await resp.json()?.catch(() => undefined);
          throw new Error(`${resp.status} ${resp.statusText} ${url.toString()}`, {
            cause: { data: json, response: resp }
          });
        }
      } else {
        if (error?.name === 'AbortError') {
          throw error;
        }
        if (error?.name === 'TimeoutError') {
          await (options.hooks?.timeout ? options.hooks?.timeout() : sleep(100));
          throw error;
        }

        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(error);
        }
      }
    },
    retry,
    options.signal
  );
}
