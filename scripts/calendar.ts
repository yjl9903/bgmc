import { BgmClient } from 'bgmc';

const client = new BgmClient(fetch);
const calendar = await client.calendar();

console.log(calendar);
