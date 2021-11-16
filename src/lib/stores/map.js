import { readable, writable } from 'svelte/store'

export let size = readable({ width: 15180, height: 10000 })
export let start = readable({ x: -7250, y: -5975 })
export let pos = writable({ x: -7250, y: -5975 })
export let scale = writable({ zoom: 0.5, min: 0.3, max: 0.7, default: 0.5 })
export let details = writable({ visible: false, project: ""})
export let viewport = writable({ width: 1000, height: 1000 })
export let landing = writable(true)