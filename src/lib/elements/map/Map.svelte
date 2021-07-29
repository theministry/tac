<script>
  import { onMount } from 'svelte';
  import { inview } from 'svelte-inview'
  import { size, pos, dragging, scale, detailsVisible, viewport } from "$lib/stores/map";

  import { scale as sc, translate as tr, compose, toCSS } from 'transformation-matrix';
  
  import Markers from "./Markers.svelte"
  import UI from "./UI.svelte"
  import Details from "./Details.svelte"
  
  import { startDrag } from "$lib/util/draggable";

  let rows = 4;
  let cols = 5;

  $: w = $size.width;
  $: h = $size.height;

  $: x = $pos.x;
  $: y = $pos.y;

  $: cx = x + 0.5 * $viewport.width;
  $: cy = y + 0.5 * $viewport.height;
  
  $: matrix = toCSS(compose(
    tr(-x, -y),
    sc($scale, $scale, cx, cy)
  ))
</script>

<div
  class="viewport"
  bind:clientWidth={$viewport.width}
  bind:clientHeight={$viewport.height}
  >
  {#if $detailsVisible }
    <Details />
  {/if}
  <div 
    class="map {$dragging ? 'dragging' : ''}"
    style="
      width: {w}px;
      height: {h}px;
      transform: {matrix};
    "
    on:mousedown={ (e) => startDrag(e) }
    on:touchstart={ (e) => startDrag(e) }
  >
    <div class="img grid">
      {#each Array(rows) as _, row}
        {#each Array(cols) as _, col}
          <div style="background-image: url('/img/bg/bg_{("00" + (row+1)).slice(-2)}_{("00" + (col+1)).slice(-2)}.jpg');" use:inview={{ rootMargin: '500px', unobserveOnEnter: true }} on:enter={()=>console.log('hi')} />
        {/each}
      {/each}
    </div>
    <Markers />
  </div>
  <UI />
</div>

<style>
  .grid {
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    grid-template-columns: repeat(5, 1fr);

    user-select: none;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
  }
  .map {
    transform-origin: top left;
    position: absolute;
    transition: all 0.1s ease-in-out;
    cursor: grab;
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
  }

  .dragging {
    transition: none;
  }
</style>