// @flow

import createKnex from 'knex'
import knexTinyLogger from '..'

const knexOptions = {}
const knex = createKnex(knexOptions)

knexTinyLogger(knex)

knexTinyLogger(knex, {
  logger: console.log,
})

knexTinyLogger(knex, {
  bindings: true,
})

// $FlowExpectError: should be absolute or fixed
knexTinyLogger(null)
