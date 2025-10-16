import { BgmClient } from 'bgmc';

const client = new BgmClient();
const calendar = await client.calendar();

console.log(calendar);
