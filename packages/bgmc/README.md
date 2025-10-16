# bgmc

[![version](https://img.shields.io/npm/v/bgmc?label=bgmc)](https://www.npmjs.com/package/bgmc)
[![CI](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml)

JavaScript [Bangumi](https://bgm.tv) client bindings.

## Installation

```bash
npm i bgmc
```

## Usage

Create the bangumi API client, and fetch something.

```ts
import { BgmClient } from 'bgmc';

const client = new BgmClient();
const calendar = await client.calendar();

console.log(calendar);
```

Get the lastest bangumi data from the cdn of [bgmd](https://unpkg.com/bgmd@0/data/index.json).

```ts
import { getCalendar } from 'bgmc/data';

const calendar = await getCalendar();
console.log(calendar);
```

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
