import pLimit from 'p-limit';
import { BgmClient } from 'bgmc';

export { BgmFetchError } from 'bgmc';

const limit = pLimit(10);

export const client = new BgmClient({
  retry: 5,
  retryTimeout: 2000,
  fetch: async (...args) => {
    return limit(() => fetch(...args));
  }
});
