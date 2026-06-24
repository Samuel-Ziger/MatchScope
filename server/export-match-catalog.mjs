#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(ROOT, 'src/data/matches.ts'), 'utf8')
const re =
  /gm\('([^']+)',\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*[^,]+,\s*[^,]+,\s*'([^']+)',\s*(?:'([^']*)'|"([^"]*)")\)/g

const catalog = []
let m
while ((m = re.exec(src))) {
  catalog.push({
    id: m[1],
    group: m[2],
    matchday: Number(m[3]),
    homeId: m[4],
    awayId: m[5],
    date: m[6],
    venue: m[7] || m[8],
  })
}

mkdirSync(join(ROOT, 'data'), { recursive: true })
writeFileSync(join(ROOT, 'data/match-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`match-catalog.json — ${catalog.length} jogos`)
