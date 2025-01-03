# bgmd

[![version](https://img.shields.io/npm/v/bgmd?label=bgmd)](https://www.npmjs.com/package/bgmd)
[![CI](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/bgmc/actions/workflows/ci.yml)

Bangumi data.

## Installation

```bash
npm i bgmd
```

You can also just use the following cdn to get the latest data.

- `https://unpkg.com/bgmd@0/data/index.json`
- `https://unpkg.com/bgmd@0/data/calendar.json`
- `https://unpkg.com/bgmd@0/data/full.json`

Or you can just use the following APIs in `bgmc/data` to fetch the latest data from cdn.

```ts
import { getCalendar } from 'bgmc/data';

const calendar = await getCalendar();
console.log(calendar);
```

## Usage

```ts
import { bangumis } from 'bgmd/full'
import { calendar } from 'bgmd/calendar'

// ...
```

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
