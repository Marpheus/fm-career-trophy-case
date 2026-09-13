/**
 * Copies the 4x3 flag SVGs out of flag-icons into public/flags.
 *
 * Importing flag-icons' stylesheet instead would ship ~440kB of CSS covering every flag in
 * two aspect ratios. Serving the files directly means the browser fetches only the handful
 * of flags actually on screen.
 */
import { cpSync, mkdirSync, readdirSync } from 'node:fs'

const SOURCE = 'node_modules/flag-icons/flags/4x3'
const TARGET = 'public/flags'

mkdirSync(TARGET, { recursive: true })
cpSync(SOURCE, TARGET, { recursive: true })
console.log(`Copied ${readdirSync(TARGET).length} flags to ${TARGET}`)
