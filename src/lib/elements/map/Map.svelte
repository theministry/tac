<script>
  import { size, pos, dragging, scale, detailsVisible, viewport } from "$lib/stores/map";
  
  import Markers from "./Markers.svelte"
  import UI from "./UI.svelte"
  import Details from "./Details.svelte"
  
  import { startDrag } from "$lib/util/draggable";

  $: w = $size.width;
  $: h = $size.height;

  $: x = $pos.x;
  $: y = $pos.y;
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
      translate: -{x}px -{y}px;
      scale: {$scale};
    "
    on:mousedown={ (e) => startDrag(e) }
  >
    <picture>
      <source type="image/webp" srcset="/img/bg.webp">
      <source type="image/jpg" srcset="/img/bg.jpg">
      <img src="/img/bg.jpg" alt="map">
    </picture>
    <Markers />
  </div>
  <UI />
</div>

<style>
  .map {
    transform-origin: top left;
    position: absolute;
    transition: all 0.1s ease-in-out;
    cursor: grab;
  }

  picture {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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