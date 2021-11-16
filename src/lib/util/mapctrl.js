export let mapctrl = (node, state={pos:{x, y}}) => {
	let parent = node.parentNode
	
	// we need border-box for accurate limit calculation
	parent.style.boxSizing = "border-box"
	node.style.boxSizing = "border-box"
	
	const setLimit = () => { 
		const n = { w: node.offsetWidth, h: node.offsetHeight } // size including border, including padding, before transform
		const p = { w: parent.clientWidth, h: parent.clientHeight } // size excluding border, includ350/150ing padding, before transform
		const s = (scale - 1)
		const x = scale * n.w >= p.w
					? { min: (p.w - n.w) - s * n.w / 2, max: s * n.w / 2, }
					: { min: scale * n.w / 2 - n.w / 2 , max: p.w - (scale * n.w / 2 + n.w / 2) }
		const y = scale * n.h >= p.h
					? { min: (p.h - n.h) - s * n.h / 2, max: s * n.h / 2 }
					: { min: scale * n.h / 2 - n.h / 2, max: p.h - (scale * n.h / 2 + n.h / 2) }
		return { x, y }
	}
	
	let {
		scale = 1,
		pos = { x: 1000, y: 1000 },
		limit = setLimit(),
	} = state;
	
	let prevPos = { x: 0, y: 0, }
	
	const zoomIn = () => {
        scale += 0.1
		limit = setLimit();
		applyTransforms()
		dispatch("move", { scale, pos, limit }, node)
	}
	
	const applyTransforms = () => {
		node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${scale})`
	}

	const moveTo = (x, y) => {
        limit = setLimit()
		pos.x = clamp(x, limit.x)
		pos.y = clamp(y, limit.y)
		applyTransforms()
		dispatch("move", { scale, pos, limit }, node)
	}
	
	const dragStart = (e) => {
		prevPos = { x: e.pageX, y: e.pageY }
		listen("pointermove", drag)
		listen("pointerup", dragEnd)
	}
	
	const drag = (e) => {
		node.setPointerCapture(e.pointerId)
		e.preventDefault();
		node.style.pointerEvents = 'none'
		moveTo(
			e.pageX - prevPos.x + pos.x,
			e.pageY - prevPos.y + pos.y,
		)
		prevPos = { x: e.pageX, y: e.pageY }
	}
	
	const dragEnd = (e) => {
		e.preventDefault();

		node.releasePointerCapture(e.pointerId)
		node.style.pointerEvents = 'auto'
		unlisten("pointermove", drag)
		unlisten("pointerup", dragEnd)
		dispatch("drag:end", { scale, pos, limit }, node)
	}
	
	const disableMenu = (e) => { e.preventDefault() }

	moveTo(pos.x, pos.y);

	listen("pointerdown", dragStart, node)
	// listen("dblclick", zoomIn, node)
	listen("contextmenu", disableMenu, node)
	
	return {
		update: (state) => {
			scale = state.scale ?? scale;
			pos.x = state.pos?.x ?? pos.x
			pos.y = state.pos?.y ?? pos.y
			console.log("moving to:", state.pos?.x)
			moveTo(pos.x, pos.y);
		},
		destroy: () => {
			unlisten("pointerdown", dragStart, node)
			// unlisten("dblclick", zoomIn, node)
			unlisten("contextmenu", disableMenu, node)
		},
	}
}

// utility functions
// events
const listen = (event, listener, node=document) => node.addEventListener(event, listener)
const unlisten = (event, listener, node=document) => node.removeEventListener(event, listener)
const dispatch = (e, detail, node=document) => node.dispatchEvent(new CustomEvent(e, { detail }))
// math
const clamp = (n, {min, max}) => { return (n <= min) ? min : (n >= max) ? max : n }