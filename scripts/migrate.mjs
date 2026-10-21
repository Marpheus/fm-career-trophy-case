// Applies db/schema.sql to the database in DATABASE_URL. Safe to re-run.
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const sql = neon(url)
const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')

// The HTTP driver runs one statement per query.
const statements = schema
  .split(/;\s*$/m)
  .map((statement) => statement.trim())
  .filter((statement) => statement.replace(/--.*$/gm, '').trim())

for (const statement of statements) await sql.query(statement)
console.log(`Applied ${statements.length} statements.`)
