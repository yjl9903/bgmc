# Bangumi Data / API Clients

[![version](https://img.shields.io/npm/v/bgmd?label=bgmd)](https://www.npmjs.com/package/bgmd)
[![version](https://img.shields.io/npm/v/bgmc?label=bgmc)](https://www.npmjs.com/package/bgmc)
[![version](https://img.shields.io/npm/v/tmdbc?label=tmdbc)](https://www.npmjs.com/package/tmdbc)
[![CI](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml)

- Bangumi data which is scraped from Bangumi and TMDB
- TypeScript wrapper of [Bangumi API](https://bangumi.github.io/api/)
- TypeScript wrapper of [TMDB API](https://developer.themoviedb.org/docs/getting-started)

## Usage

### bgmd

[![version](https://img.shields.io/npm/v/bgmd?label=bgmd)](https://www.npmjs.com/package/bgmd)

```bash
npm i bgmd
```

You can just use the following cdn to get the latest data.

- `https://unpkg.com/bgmd@0/data/index.json`
- `https://unpkg.com/bgmd@0/data/calendar.json`
- `https://unpkg.com/bgmd@0/data/full.json`

Or you can just use the following APIs in `bgmc/data` to fetch the latest data from cdn.

```ts
import { getCalendar } from 'bgmc/data';

const calendar = await getCalendar();
console.log(calendar);
```

### bgmc

[![version](https://img.shields.io/npm/v/bgmc?label=bgmc)](https://www.npmjs.com/package/bgmc)

```bash
npm i bgmc
```

```ts
import { BgmClient } from 'bgmc';

const client = new BgmClient(fetch);
const calendar = await client.calendar();

console.log(calendar);
```

### tmdbc

[![version](https://img.shields.io/npm/v/tmdbc?label=tmdbc)](https://www.npmjs.com/package/tmdbc)

```bash
npm i tmdbc
```

```ts
import { TMDBClient } from 'tmdbc';

const client = new TMDBClient({ token: 'Your token' });
```

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
