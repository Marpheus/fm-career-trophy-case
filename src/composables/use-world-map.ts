import { shallowRef } from 'vue'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { NATION_GEO } from '../data/nations'

export const MAP_WIDTH = 1000
export const MAP_HEIGHT = 500

export interface MapShape {
  readonly code: string
  readonly d: string
}

export interface MapDot {
  readonly code: string
  readonly x: number
  readonly y: number
}

interface NationProperties {
  code: string
}

const shapes = shallowRef<readonly MapShape[]>([])
const dots = shallowRef<readonly MapDot[]>([])
const isLoading = shallowRef(true)
const loadError = shallowRef<string | null>(null)
let started = false

/**
 * Geometry is fetched rather than imported so the deeply nested coordinate arrays stay out
 * of the TypeScript graph and the JS bundle. Path strings are built once on load - they
 * never change, since panning and zooming happen via an SVG transform.
 */
const build = (topology: Topology) => {
  const collection = feature(
    topology,
    topology.objects.nations as GeometryCollection<NationProperties>,
  )

  const projection = geoNaturalEarth1().fitExtent(
    [
      [4, 4],
      [MAP_WIDTH - 4, MAP_HEIGHT - 4],
    ],
    collection,
  )
  const path = geoPath(projection)

  const nextShapes: MapShape[] = []
  for (const item of collection.features) {
    const code = item.properties.code
    if (NATION_GEO[code]?.small) continue // drawn as a dot instead
    const d = path(item)
    if (d) nextShapes.push({ code, d })
  }

  const nextDots: MapDot[] = []
  for (const [code, geo] of Object.entries(NATION_GEO)) {
    if (!geo.small) continue
    const point = projection([geo.point[0], geo.point[1]])
    if (point) nextDots.push({ code, x: point[0], y: point[1] })
  }

  shapes.value = nextShapes
  dots.value = nextDots
}

const loadMap = async () => {
  if (started) return
  started = true
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/world.topo.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    build((await response.json()) as Topology)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load map'
  } finally {
    isLoading.value = false
  }
}

export const useWorldMap = () => {
  void loadMap()
  return { shapes, dots, isLoading, loadError }
}
