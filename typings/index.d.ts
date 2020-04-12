// Minimum TypeScript Version: 3.4

import Knex = require('knex')

export interface KnexTinyLoggerOptions {
  logger?: (message?: any, ...optionalParams: any[]) => void,
  bindings?: boolean
}

export default function knexTinyLogger(knex: Knex, options?: KnexTinyLoggerOptions): Knex
