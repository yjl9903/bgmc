export class BgmFetchError extends Error {
  public readonly response: Response;

  public constructor(resp: Response) {
    super(resp.statusText);
    this.response = resp;
  }
}
