/**
 * Builds the world map data from Natural Earth 50m "admin 0 map subunits".
 *
 * Subunits (not countries) are the right source: they split the UK into England,
 * Scotland, Wales and Northern Ireland, which are four separate footballing nations.
 * Everything else is dissolved back to its parent country.
 *
 * Outputs:
 *   public/data/world.topo.json - simplified TopoJSON, fetched at runtime
 *   src/data/nations.json     - code, name, continent, flag for every nation on the map
 *   src/data/nation-geo.json  - centroid + "too small to click" flag per nation
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_map_subunits.geojson'
const CACHE_DIR = 'scripts/.cache'
const SOURCE_FILE = `${CACHE_DIR}/ne_50m_admin_0_map_subunits.geojson`
const TAGGED_FILE = `${CACHE_DIR}/nations.geojson`
const ATTRS_FILE = `${CACHE_DIR}/attrs.json`
const TOPO_FILE = 'public/data/world.topo.json'

/**
 * Simplified area (km2) below which a nation is unclickably small on a world map and
 * gets a dot marker instead. Measured after simplification, so it runs a little under
 * the real-world figure.
 */
const SMALL_AREA_KM2 = 12000

/**
 * Default confederation from geography. Football nations belong to confederations, not
 * continents, so this is only a starting point - see CONFEDERATION_OVERRIDES.
 */
const CONTINENT_CONFEDERATION = {
  Africa: 'CAF',
  Asia: 'AFC',
  Europe: 'UEFA',
  'North America': 'CONCACAF',
  'South America': 'CONMEBOL',
  Oceania: 'OFC',
}

/** Nations whose confederation does not follow from which continent they sit on. */
const CONFEDERATION_OVERRIDES = {
  TUR: 'UEFA',
  ISR: 'UEFA',
  CYP: 'UEFA',
  ARM: 'UEFA',
  AZE: 'UEFA',
  GEO: 'UEFA',
  KAZ: 'UEFA',
  RUS: 'UEFA',
  AUS: 'AFC',
  GUM: 'AFC',
  MNP: 'AFC',
  GUY: 'CONCACAF',
  SUR: 'CONCACAF',
}

/** flag-icons codes that don't follow from ISO 3166-1 alpha-2. */
const FLAG_OVERRIDES = {
  ENG: 'gb-eng',
  SCT: 'gb-sct',
  WLS: 'gb-wls',
  NIR: 'gb-nir',
  PSE: 'ps',
  KOS: 'xk',
}

/** Natural Earth's formal names, shortened to what a football fan would call them. */
const NAME_OVERRIDES = {
  HKG: 'Hong Kong',
  MAC: 'Macau',
  SRB: 'Serbia',
  USA: 'United States',
  TUR: 'Türkiye',
  BIH: 'Bosnia & Herzegovina',
  CZE: 'Czechia',
  KOR: 'South Korea',
  PRK: 'North Korea',
  ARE: 'UAE',
  COD: 'DR Congo',
  TZA: 'Tanzania',
  LAO: 'Laos',
  VNM: 'Vietnam',
  SYR: 'Syria',
  IRN: 'Iran',
  MDA: 'Moldova',
  MKD: 'North Macedonia',
  BRN: 'Brunei',
  TTO: 'Trinidad & Tobago',
  ATG: 'Antigua & Barbuda',
  KNA: 'St Kitts & Nevis',
  VCT: 'St Vincent & the Grenadines',
  LCA: 'St Lucia',
  BHS: 'Bahamas',
  GMB: 'Gambia',
  CIV: 'Ivory Coast',
  CPV: 'Cape Verde',
  STP: 'São Tomé & Príncipe',
  SWZ: 'Eswatini',
  TLS: 'Timor-Leste',
  FSM: 'Micronesia',
  PNG: 'Papua New Guinea',
}

/** Nations FM knows that Natural Earth 50m has no polygon for. Rendered as dots. */
const EXTRA_NATIONS = [
  { code: 'GIB', name: 'Gibraltar', confederation: 'UEFA', flag: 'gi', point: [-5.35, 36.14] },
]

const nationCode = (p) => {
  if (p.ADM0_A3 === 'GBR') return p.SU_A3
  if (p.ADM0_A3 === 'PSX') return 'PSE'
  return p.ADM0_A3
}

const download = () => {
  mkdirSync('public/data', { recursive: true })
  mkdirSync(CACHE_DIR, { recursive: true })
  if (existsSync(SOURCE_FILE)) return
  console.log('Downloading Natural Earth subunits...')
  execFileSync('curl', ['-sL', '--fail', '-o', SOURCE_FILE, SOURCE_URL], { stdio: 'inherit' })
}

/**
 * Total polygon area in square degrees, used only to tell a nation's mainland from its
 * outlying territories. Spain's Canary Islands and France's overseas departments carry a
 * different CONTINENT than the mainland, so taking whichever subunit appears first files
 * Spain under Africa. A bounding box is not enough here - the Caribbean Netherlands is a
 * few specks spread over a wide box, which would outrank the mainland.
 *
 * Absolute per-ring area keeps this independent of Natural Earth's ring winding.
 */
const ringArea = (ring) => {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1])
  }
  return Math.abs(sum / 2)
}

const polygonArea = (geometry) => {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  let total = 0
  for (const rings of polygons) {
    total += ringArea(rings[0])
    for (let i = 1; i < rings.length; i += 1) total -= ringArea(rings[i])
  }
  return total
}

const tag = () => {
  const source = JSON.parse(readFileSync(SOURCE_FILE, 'utf8'))
  const features = []
  const meta = new Map()
  const mainlandSize = new Map()

  for (const feature of source.features) {
    const p = feature.properties
    const confederation = CONTINENT_CONFEDERATION[p.CONTINENT]
    if (!confederation) continue // drops Antarctica and open-ocean features

    const code = nationCode(p)
    features.push({ ...feature, properties: { code } })

    const size = polygonArea(feature.geometry)
    if (meta.has(code) && size <= mainlandSize.get(code)) continue
    mainlandSize.set(code, size)

    const iso = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2
    meta.set(code, {
      code,
      name: NAME_OVERRIDES[code] ?? (p.ADM0_A3 === 'GBR' ? p.SUBUNIT : p.ADMIN),
      confederation: CONFEDERATION_OVERRIDES[code] ?? confederation,
      flag: FLAG_OVERRIDES[code] ?? (iso && iso !== '-99' ? iso.toLowerCase() : ''),
    })
  }

  writeFileSync(TAGGED_FILE, JSON.stringify({ type: 'FeatureCollection', features }))
  return meta
}

const MAPSHAPER = 'node_modules/.bin/mapshaper'

const simplify = () => {
  console.log('Dissolving and simplifying...')
  execFileSync(
    MAPSHAPER,
    [
      TAGGED_FILE,
      '-dissolve2',
      'code',
      '-simplify',
      '6%',
      'keep-shapes',
      '-clean',
      '-o',
      'format=topojson',
      'id-field=code',
      TOPO_FILE,
    ],
    { stdio: 'inherit' },
  )
}

/**
 * Area and label point come from mapshaper, not d3-geo: Natural Earth is shapefile-derived
 * and winds rings clockwise, which d3-geo reads as the complement of the shape (Brazil comes
 * out tiny, centroids land at their antipode). mapshaper is winding-independent, measures
 * area on an equal-area projection, and innerX/innerY is a point guaranteed to sit inside
 * the polygon - which a centroid is not for crescent-shaped nations like Croatia.
 */
const measure = () => {
  execFileSync(
    MAPSHAPER,
    [
      TOPO_FILE,
      '-each',
      'cx = this.innerX, cy = this.innerY',
      '-proj',
      '+proj=cea',
      '-each',
      'km2 = Math.round(this.area / 1e6)',
      '-filter-fields',
      'code,cx,cy,km2',
      '-o',
      'format=json',
      ATTRS_FILE,
    ],
    { stdio: 'inherit' },
  )
  return JSON.parse(readFileSync(ATTRS_FILE, 'utf8'))
}

const emit = (meta, attrs) => {
  const geo = {}
  const nations = []

  const collapsed = []

  for (const row of attrs) {
    const info = meta.get(row.code)
    if (!info) continue
    // Simplification can collapse a micro-state (Vatican City) to nothing. None are
    // FIFA members; if one ever matters, add it to EXTRA_NATIONS with a fixed point.
    if (row.cx === null || row.cy === null) {
      collapsed.push(row.code)
      continue
    }
    geo[row.code] = {
      point: [+row.cx.toFixed(3), +row.cy.toFixed(3)],
      small: row.km2 < SMALL_AREA_KM2,
    }
    nations.push(info)
  }

  for (const { point, ...info } of EXTRA_NATIONS) {
    geo[info.code] = { point, small: true }
    nations.push(info)
  }

  nations.sort((a, b) => a.name.localeCompare(b.name))
  writeFileSync('src/data/nations.json', JSON.stringify(nations, null, 2))
  writeFileSync('src/data/nation-geo.json', JSON.stringify(geo, null, 2))

  const noFlag = nations.filter((n) => !n.flag).map((n) => n.code)
  console.log(
    `${nations.length} nations, ${Object.values(geo).filter((g) => g.small).length} as dots`,
  )
  if (noFlag.length) console.log(`No flag code for: ${noFlag.join(', ')}`)
  if (collapsed.length) console.log(`Collapsed by simplification, dropped: ${collapsed.join(', ')}`)
}

download()
const meta = tag()
simplify()
emit(meta, measure())
