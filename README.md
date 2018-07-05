# knex-tiny-logger

[![](https://img.shields.io/npm/v/knex-tiny-logger.svg?style=flat-square)](https://npmjs.com/package/knex-tiny-logger)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)

> Zero config queries logger for knex

![](https://cloud.githubusercontent.com/assets/4437249/24814454/5215bd9c-1bda-11e7-8574-5f93042395dd.png)

## Usage

Install the package:

```bash
$ yarn add knex-tiny-logger
```

Apply `knex-tiny-logger` to `knex` instance:

```js
import createKnex from 'knex'
import knexTinyLogger from 'knex-tiny-logger'

const knexOptions = {} // Your knex config
const knex = createKnex(knexOptions)
knexTinyLogger(knex)

// alternative
// knex-tiny-logger returns knex instance
// so you can do like this
const knex = knexTinyLogger(createKnex(knexOptions))
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
knexTinyLogger(knex, { logger: awesomeLogger })
```

Also you can disable bindings:
```js
knexTinyLogger(knex, { bindings: false })
```

## License

[MIT](LICENSE.md)
