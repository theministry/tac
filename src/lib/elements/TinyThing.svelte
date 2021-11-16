<script>
    import { onMount } from "svelte";

    export let img = "01"
    $: url = `/img/projects/object_${img}.png`

    import { spring } from 'svelte/motion';

	let coords = spring({ x: Math.random() * 100, y: Math.random() * 100 }, {
		stiffness: 0.0002,
		damping: 0.02,
	});

    onMount(() => {
        coords.set({ x: Math.random() * 100, y: Math.random() * 100 })
        const interval = setInterval(() => {
            console.log("WUT")
            coords.set({ x: Math.random() * 100, y: Math.random() * 100 })
        }, 10000)
    })
</script>

<style>
    div {
        width: 200px;
        height: 200px;

        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        position: absolute;
    }
</style>

<div
    style="
        background-image: url('{url}');
        transform: translate({$coords.x}vw, {$coords.y}vh);
    "
>
    
</div>