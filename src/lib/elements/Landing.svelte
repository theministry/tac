
<script>
    import { fade } from 'svelte/transition';

    import { landing } from '$lib/stores/map'
    import { mapctrl } from '$lib/util/mapctrl'
    import Topbar from '$lib/elements/Topbar.svelte'
    import TinyThing from '$lib/elements/TinyThing.svelte';
    import { onMount } from 'svelte';

    $: x = 0;
    $: y = 0;

    let welcome;
    let windowWidth;

    onMount(() => { 
        welcome.style.margin='0';
        x = innerWidth >= 500 ? 150 : 25;
        y = windowWidth >= 500 ? 150 : 25;
    })
</script>

<style>
    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        --bgc: rgba(255,255,255,0.8);
        --fgc: rgb(229, 224, 216);
        background-image:  linear-gradient(var(--fgc) 2px, transparent 2px), linear-gradient(90deg, var(--fgc) 2px, transparent 2px), linear-gradient(var(--fgc) 1px, transparent 1px), linear-gradient(90deg, var(--fgc) 1px, var(--bgc) 1px);
        background-size: 10rem 10rem, 10rem 10rem, 2rem 2rem, 2rem 2rem;
        background-position: 2rem 2rem;
    }

    .warning {
        display: none;
    }

    .window {
        width: 500px;
        max-width: 80%;
        background-color: white;
        border: 1px solid black;
        margin-left: 150px;
        margin-top: 150px;
        margin-right: 0;
        margin-bottom: 0;
        z-index: 1000;
    }

    @media screen and (max-width: 500px) {
        .window {
            margin-left: 25px;
            margin-top: 25px;
        }

        .warning {
            display:block;
            font-weight: bold
        }
    }

    main {
        margin: 1rem .5rem 1rem .5rem;
        font-size: 1rem;
        line-height: 1.3rem;
    }

    p {
        margin: 0;
        margin-top: 2rem;
    }

    button {
        background-color: white;
        font-weight: bold;
        text-decoration: underline;
        border: none;
        font-size: 1rem;
        margin: 0;
        padding: 0;
        cursor: pointer;
    }

    button:hover {
        text-decoration: line-through
    }

</style>

<svelte:window bind:innerWidth={windowWidth} />

<div class="overlay" transition:fade>
    <TinyThing img="07" />
    <TinyThing img="07" />
    <TinyThing img="07" />
    <TinyThing img="15" />
    <TinyThing img="02" />
    <TinyThing img="03" />
    <TinyThing img="04" />
    <TinyThing img="08" />
    <TinyThing img="17" />
    <TinyThing img="aa" />
    <TinyThing img="bb" />
    <div 
        class="window"
        use:mapctrl={{ pos: { x, y}}}
        bind:this={welcome}
    >
        <Topbar 
            text = "Welcome"
            action = "/ X"
            on:action = { () => $landing = false }
        />
        <main>
            This shared future landscape research is part of the future Temporary Art Centre(TAC) development series. Looking at the social structures of work and leisure, we want to reimagine the commons and examine our communal behaviours and actions within the framework of spatial identity — DOING is an action and DOING TOGETHER through various instructions written by the inhabitants is an attitude and learning / unlearning process to shape our common terrains together. 
            <p class="warning">This site is designed with larger screens in mind. Some features may not work correctly.</p>
            <p><button on:click={() => $landing = false}>enter</button></p>
        </main>
    </div>
</div>