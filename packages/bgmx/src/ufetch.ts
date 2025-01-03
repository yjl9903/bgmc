export const ufetch = async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
  const proxy = getProxy();
  if (!!proxy) {
    // @ts-ignore
    const { EnvHttpProxyAgent } = await import('undici');
    return fetch(url, {
      ...init,
      // @ts-ignore
      dispatcher: new EnvHttpProxyAgent()
    });
  } else {
    // @ts-ignore
    return fetch(url, init);
  }
};

export function getProxy() {
  const env = process?.env ?? {};
  const list = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'];
  for (const l of list) {
    const t = env[l];
    if (!!t) {
      return t;
    }
  }
  return undefined;
}
