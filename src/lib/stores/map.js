import { readable, writable, derived, get } from 'svelte/store'
import { round } from '$lib/util/round'

let config = {
  bgWidth: 15188,
  bgHeight: 10000,

  startX: 4800,
  startY: 6100,
  moveStep: 50,

  startZoom: 1.0,
  zoomStep: 0.2,
  minZoom: 0.2,
  maxZoom: 1.4,
}

function createScale(config) {
  const { subscribe, set, update } = writable(config.startZoom)

  const zoom = (n = config.zoomStep) => update( scale => {

    scale += n
    
    scale = (scale <= config.minZoom) ? config.minZoom : scale;
    scale = (scale >= config.maxZoom) ? config.maxZoom : scale;

    return round(scale, 2)
  })

  const zoomIn = () => zoom()
  const zoomOut = () => zoom(-config.zoomStep)

  const reset = () => set(config.startZoom)

  return {
    subscribe,
    zoom,
    zoomIn,
    zoomOut,
    reset,
  }
}

function createPos(config, viewport, scale) {
  const { subscribe, set, update } = writable({ x: config.startX, y: config.startY });

  const updateMinMax = () => {
    let $viewport = get(viewport)
    let $scale = get(scale)

    let minX = 0
    let minY = 0
    let maxX = config.bgWidth - $viewport.width;
    let maxY = config.bgHeight - $viewport.height;
    return { minX, minY, maxX, maxY }
  }

  const move = ({x=0, y=0}) => update( pos => {
    let { minX, minY, maxX, maxY } = updateMinMax()

    pos.x += x;
    pos.y += y;

    pos.x = (pos.x <= minX) ? minX : pos.x;
    pos.x = (pos.x >= maxX) ? maxX : pos.x;
    pos.y = (pos.y <= minY) ? minY : pos.y;
    pos.y = (pos.y >= maxY) ? maxY : pos.y;
    
    return pos
  })

  const moveTo = ({x=0, y=0}) => {
    let { minX, minY, maxX, maxY } = updateMinMax()

    x = (x <= minX) ? minX : x;
    y = (y <= minY) ? minY : y;
    x = (x >= maxX) ? maxX : x;
    y = (y >= maxY) ? maxY : y;
    set({ x, y })
  }

  const moveRight = (n = config.moveStep) => move({ x: + n }) 
  const moveLeft = (n = config.moveStep) => move({ x: - n }) 
  const moveUp = (n = config.moveStep) => move({ y: - n }) 
  const moveDown = (n = config.moveStep) => move({ y: n }) 

  const reset = () => moveTo({ x:config.startX, y:config.startY })

  return {
    subscribe,
    moveRight,
    moveLeft,
    moveUp,
    moveDown,
    moveTo,
    reset,
  }
}

export const size = readable({ 
  width: config.bgWidth,
  height: config.bgHeight
})

export const viewport = writable({
  width: 1000,
  height: 1000,
})

export const scale = createScale(config)
export const pos = createPos(config, viewport, scale);

export const dragging = writable(false)
export const moved = writable(false)

export const detailsVisible = writable(false)
export const detailsProject = writable()