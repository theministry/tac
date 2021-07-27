import { readable } from 'svelte/store'

export const mouse = readable({x:0, y:0}, (set) => {
	document.body.addEventListener("mousemove", move);
	
	function move(event) {
		set({
			x: event.clientX,
			y: event.clientY,
		});
	}
	
	return () => {
		document.body.removeEventListener("mousemove", move);
	}
})

export const wind = readable({width:0, height:0}, (set) => {
    window.addEventListener("resize", resize);
    
    function resize() {
        set({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }
    
    return () => {
        window.removeEventListener("resize", resize);
    }
})
