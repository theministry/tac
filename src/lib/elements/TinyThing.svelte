<script>
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    export let img = "01"
    $: url = `/img/projects/object_${img}.png`

    import { spring } from 'svelte/motion';

    $: display = false;

	let coords = spring({ x: Math.random() * 100, y: Math.random() * 100 }, {
		stiffness: 0.0002,
		damping: 0.02,
	});

    onMount(() => {
        display = true;
        const timeout = setTimeout(() => coords.set({ x: Math.random() * 100, y: Math.random() * 100 }), 1200)
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

{#if display }
<div
    style="
        background-image: url('{url}');
        transform: translate({$coords.x}vw, {$coords.y}vh);
    "
    transition:fade={{duration: 2000, delay: 1000}}
>
</div>
{/if}