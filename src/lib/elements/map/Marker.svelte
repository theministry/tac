<script>
  import { details } from "$lib/stores/map"

  export let project;

  let marker = project.frontmatter.marker
  let left = project.frontmatter.coordinates.x
  let top = project.frontmatter.coordinates.y
  let size = project.frontmatter.size

  const toggle = (e) => {
    e.stopPropagation();
    $details.visible = true
    $details.project = project
  }
</script>

<div
  class="marker"
  style="
    background-image: url('{marker}');
    left:{left}px;
    top:{top}px;
    width: {size.width}px;
    height: {size.height}px;
  "
  on:click={toggle}
>

</div>

<style>
  .marker {
    display:block;
    position: absolute;
    width: 200px;
    height: 200px;
    background-size: contain;
    background-repeat: no-repeat;
    margin-left: 500px;
    transform-origin: center center;

    transition: 200ms ease-in-out;
  }

  .marker:hover {
    /* -webkit-filter: drop-shadow(4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 -4px 0 white) drop-shadow(6px 0 0 black) drop-shadow(0 6px 0 black) drop-shadow(-6px 0 0 black) drop-shadow(0 -6px 0 black); */
    /* filter: drop-shadow(4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 -4px 0 white) drop-shadow(6px 0 0 black) drop-shadow(0 6px 0 black) drop-shadow(-6px 0 0 black) drop-shadow(0 -6px 0 black); */
    
    /* filter: brightness(120%); */
    cursor: pointer;
    
    /* animation: pulse-animation 2s infinite ease-in-out; */
    
    transform: scale(1.1);
    filter: brightness(110%) drop-shadow(1px 0 0 black) drop-shadow(0 1px 0 black) drop-shadow(-1px 0 0 black) drop-shadow(0 -1px 0 black);
  }

  @keyframes pulse-animation {
    0% {
      transform: scale(1.08);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1.08);
    }
  }
</style>
