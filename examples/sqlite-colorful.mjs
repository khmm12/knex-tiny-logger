import createKnex from 'knex'
import knexTinyLogger from 'knex-tiny-logger'
import { colorfulLogger, colorfulSyntaxThemes } from 'knex-tiny-logger/colorful'

const knex = knexTinyLogger(
  createKnex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  }),
  {
    // Syntax-highlight the SQL body; drop the options for plain state-tinted output.
    logger: colorfulLogger({ highlight: true, theme: colorfulSyntaxThemes.dracula }),
  },
)

await knex.schema.createTable('users', (table) => {
  table.increments('id')
  table.string('name').notNullable()
  table.integer('age').notNullable()
})

await knex('users').insert([
  { name: 'Ada', age: 37 },
  { name: 'Grace', age: 85 },
])

await knex('users').where('age', '>', 40).select('id', 'name', 'age')
await knex('users').count({ total: '*' })

try {
  await knex.raw('select * from missing_table where id = ?', [1])
} catch {
  // Keep the example focused on logger output.
}

await knex.destroy()
