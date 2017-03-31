# knex-tiny-logger

[![Github All Releases](https://img.shields.io/github/downloads/knex-tiny-logger/knex-tiny-logger/total.svg?style=flat-square)]()
[![](https://img.shields.io/npm/v/knex-tiny-logger.svg?style=flat-square)](https://npmjs.com/package/knex-tiny-logger)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)

> Zero config queries logger for knex

## Usage

Install the package:

```bash
$ yarn add knex-tiny-logger
```

Decorate knex with `knex-tiny-logger`:

```js
import createKnex from 'knex'
import knexTinyLogger from 'knex-tiny-logger'

const knexOptions = {} // Your knex config
const knex = knexTinyLogger(createKnex(knexOptions))

// or
const knex = createKnex(knexOptions)
knexTinyLogger(knex)
```

## Advanced usage

By default `knex-tiny-logger` uses `console.log`, but you can specify any logger which your prefer:
```js
import createKnex from 'knex'
import knexTinyLogger from 'knex-tiny-logger'
import initDebug from 'debug'

const awesomeLogger = initDebug('my-project:knex')
const knexOptions = {} // Your knex config
const knex = createKnex(knexOptions)
knexTinyLogger(knex, { logger })
```

## License

[MIT](LICENSE.md)
