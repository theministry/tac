<script>
  import { getContext } from "svelte"
  import Marker from "./Marker.svelte"
  import { meeting, coworking, common, atelier } from "$lib/stores/filters";

  let projects = getContext("projects")

  export const checkLocation = (location) => {
    if (location === "meeting" && $meeting) return true;
    if (location === "coworking" && $coworking) return true;
    if (location === "common" && $common) return true;
    if (location === "atelier" && $atelier) return true;
  }
</script>

{#each Object.values(projects) as project (project)}
  {#if checkLocation(project.frontmatter.location)}
    <Marker
      project={project}
    />
  {/if}
{/each}