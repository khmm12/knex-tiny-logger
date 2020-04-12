import createKnex from 'knex'
import knexTinyLogger from 'knex-tiny-logger'

const knexOptions = {}
const knex = createKnex(knexOptions)

knexTinyLogger(knex)

knexTinyLogger(knex, {
  logger: console.log
})

knexTinyLogger(knex, {
  bindings: true
})

knexTinyLogger(null) // $ExpectError
