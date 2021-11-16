<script>
  import { getContext } from "svelte";
  import { details } from "$lib/stores/map"

  // import Topbar from "$lib/elements/Topbar.svelte"
  import Project from "$lib/elements/Project.svelte"

  const toggle = () => {
    $details.visible = false
    $details.project = ""
  }
</script>

{#if $details.visible}
<aside>
  <Project closable bind:project={$details.project} on:close={toggle} />
</aside>
{/if}

<style>
  aside {
    position: absolute;
    z-index: 100;

    /* windowed layout */
    /* left: 1rem;
    top: 1rem;
    height: calc(100% - 2rem); */

    /* sidebar layout */
    left: 0;
    top: 0;
    height: 100%;

    display: flex;
    flex-direction: column;
    width: 400px;
    border-right: var(--border);

    max-width: 80%;
  }
</style>
