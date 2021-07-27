<script>
  import { scale } from "$lib/stores/map";
  import { moved, detailsVisible, detailsProject } from "$lib/stores/map"

  export let project;

  let marker = project.frontmatter.marker
  let left = project.frontmatter.coordinates.x
  let top = project.frontmatter.coordinates.y
  let size = project.frontmatter.size

  const toggle = () => {
    if(!$moved) {
      $detailsVisible = true
      $detailsProject = project
    }
  }
</script>

<!-- <div
  class="marker"
  style="
    left: {left}px;
    top: {top}px;
    width: {diameter}px;
    height: {diameter}px;
    background-image: url('img/{marker}');
  "
  on:click={() => {
    console.log("clicking", id);
    // $sidebarVisible = true;
    // $sidebarProject = id;
  }}
>
  <div
    class="label"
    style="
      left: {diameter + 4}px;
      top: {radius - 8}px;
    "
  >
    {name}
  </div>
</div>

<style>
  .marker {
    display: block;
    position: relative;
    width: 16px;
    height: 16px;
    border-radius: 8px;
    position: absolute;
    transition: all 0.1s ease-in-out;
    cursor: pointer;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .label {
    position: absolute;
    width: auto;
    white-space: nowrap;
    height: 16px;
    background-color: black;
    color: white;
    padding: 2px;
    visibility: hidden;
  }

  .marker:hover .label {
    visibility: visible;
  }
</style> -->

<div
  class="marker"
  style="
    background-image: url('img/projects/{marker}');
    left:{left}px;
    top:{top}px;
    width: {size.width}px;
    height: {size.height}px;
  "
  on:mouseup="{toggle}"
>

</div>

<style>
  .marker {
    display:block;
    position: absolute;
    width: 200px;
    height: 200px;
    background-size: cover;
    background-repeat: no-repeat;
    margin-left: 500px;
    transform-origin: top left;
  }

  .marker:hover {
    /* -webkit-filter: drop-shadow(4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 -4px 0 white) drop-shadow(6px 0 0 black) drop-shadow(0 6px 0 black) drop-shadow(-6px 0 0 black) drop-shadow(0 -6px 0 black); */
    /* filter: drop-shadow(4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 -4px 0 white) drop-shadow(6px 0 0 black) drop-shadow(0 6px 0 black) drop-shadow(-6px 0 0 black) drop-shadow(0 -6px 0 black); */
    filter: brightness(120%) drop-shadow(0.5px 0 0 black) drop-shadow(0 0.5px 0 black) drop-shadow(-0.5px 0 0 black) drop-shadow(0 -0.5px 0 black);
  
    /* filter: brightness(120%); */
    cursor: pointer;
  }
</style>