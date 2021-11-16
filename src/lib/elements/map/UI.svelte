<script>
  import { pos, scale, start, details } from "$lib/stores/map";

  import ArrowLeft20 from "carbon-icons-svelte/lib/ArrowLeft20";
  import ArrowRight20 from "carbon-icons-svelte/lib/ArrowRight20";
  import ArrowUp20 from "carbon-icons-svelte/lib/ArrowUp20";
  import ArrowDown20 from "carbon-icons-svelte/lib/ArrowDown20";

  import Add20 from "carbon-icons-svelte/lib/Add20";
  import Subtract20 from "carbon-icons-svelte/lib/Subtract20";
  import Reset20 from "carbon-icons-svelte/lib/Reset20";

  $: minzoom = $scale.zoom < $scale.min;
  $: maxzoom = $scale.zoom > $scale.max;
</script>

<button class="left" on:click={() => $pos.x += 250 }>
  <ArrowLeft20 title="left" />
</button>

<button class="right" on:click={() => $pos.x -= 250 }>
  <ArrowRight20 title="right" />
</button>

<button class="up" on:click={() => $pos.y += 250}>
  <ArrowUp20 title="up" />
</button>

<button class="down" on:click={() => $pos.y -= 250}>
  <ArrowDown20 title="down" />
</button>

<button class="zoomin" on:click={() => $scale.zoom += 0.1} disabled={maxzoom}>
  <Add20 title="zoom in" />
</button>

<button class="zoomout" on:click={() => $scale.zoom -= 0.1} disabled={minzoom}>
  <Subtract20 title="zoom out" />
</button>

<button class="reset" on:click={() => {
    $scale.zoom = $scale.default
    $pos = $start
    $details.visible = false
    $details.project = ""
  }}>
  <Reset20 title="reset map" />
</button>

<style>
  button {
    position: absolute;
    color: black;
    background-color: white;
    border: 2px solid black;
    padding: 2px 4px;
  }

  @media screen and (max-width: 600px) {
    .left, .right, .up, .down {
      display: none;
    }
  }

  button:hover {
    background-color: var(--grey);
    cursor: pointer;
  }

  button:active {
    color: white;
    background-color: black;
  }

  .left {
    left: 10px;
    top: calc(100% / 2 - 15px);
  }

  .right {
    right: 10px;
    top: calc(100% / 2 - 15px);
  }

  .up {
    left: calc(100% / 2 - 15px);
    top: 10px;
  }

  .down {
    left: calc(100% / 2 - 15px);
    bottom: 10px;
  }

  .reset {
    right: 10px;
    bottom: 10px;
  }

  .zoomin {
    bottom: 90px;
    right: 10px;
  }

  .zoomout {
    bottom: 50px;
    right: 10px;
  }

  button:disabled {
    background-color: var(--grey);
    color: #999;
    border: 2px solid #999;
  }
</style>
