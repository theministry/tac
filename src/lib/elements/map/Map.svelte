<script>
  import { inview } from 'svelte-inview'
  import { size, pos, scale, details, viewport } from "$lib/stores/map";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  
  import Markers from "./Markers.svelte"
  import UI from "./UI.svelte"
  import Details from "./Details.svelte"

  import { mapctrl } from "$lib/util/mapctrl"

  $: display = false;
  onMount(() => { display = true;});


  let rows = 8;
  let cols = 12;

  $: w = $size.width;
  $: h = $size.height;

  $: tileWidth = w / cols;
  $: tileHeight = h / rows;
</script>

{#if display}

<div
  class="viewport"
  bind:clientWidth={$viewport.width}
  bind:clientHeight={$viewport.height}
  transition:fade={{duration: 1500}}
  >
  {#if $details.visible }
    <Details />
  {/if}
  <div 
    class="map dragging"
    style="
      width: {w}px;
      height: {h}px;
    "
    use:mapctrl={{
      pos: { x: $pos.x, y: $pos.y },
      scale: $scale.zoom,
    }}
    on:dblclick={() => { $scale.zoom = $scale.zoom <= $scale.max ?  $scale.zoom + 0.1 : $scale.zoom }}
    on:drag:end={(e) => {
      console.log(e.detail)
      pos.set({x: e.detail.pos.x, y: e.detail.pos.y});
    }}
  >
    <div
      class="img grid"
      style="
        grid-template-rows: repeat({rows}, {tileHeight}px);
        grid-template-columns: repeat({cols}, {tileWidth}px);
      "
    >
      {#each Array(rows) as _, row}
        {#each Array(cols) as _, col}
          <div 
            class="tile"
            style="background-image: url('/img/bg/bg_{(101 + col)}_{(101 + row)}.webp');"
            use:inview={{ rootMargin: '2000px', unobserveOnEnter: true }} 
          />
        {/each}
      {/each}
    </div>
    <Markers />
  </div>
  <UI />
</div>

{/if}

<style>
  .grid {
    display: grid;

    user-select: none;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
  }
  .map {
    transform-origin: center center;
    position: absolute;
    /* transition: all 0.1s ease-in-out; */
    cursor: grab;
  }

  .map:active {
    cursor: grabbing;
  }

  .img {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    width: 100%;
    height: 100%;
  }

  .viewport {
    position: relative;
    overflow: hidden;

    display: flex;
    flex-grow: 1;

    margin: 0;
    padding: 0;

    --sbg: rgb(229, 224, 216);
    /* --sbg: white; */
    --sfg: rgba(77, 128, 121, .3);

    background-color: var(--sbg);
    background-image: radial-gradient(circle, var(--sfg) 1px, transparent 1px);
    background-size: 2rem 2rem;
  }

  .dragging {
    transition: none;
  }

  .tile {
    background-size: cover;
  }

</style>