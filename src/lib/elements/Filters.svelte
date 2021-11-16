<script>
  import Checkbox from "$lib/elements/Checkbox.svelte";

  import { meeting, coworking, common, atelier } from "$lib/stores/filters";
  import { pos, details, scale, viewport, } from "$lib/stores/map"

  export let projects;

  $: checkLocation = (location) => {
    if (location === "meeting" && $meeting) return true;
    if (location === "coworking" && $coworking) return true;
    if (location === "common" && $common) return true;
    if (location === "atelier" && $atelier) return true;
  };
</script>

<div class="filters">
  <header><span>Location</span></header>
  <ul>
    <li><Checkbox bind:checked={$meeting}>Meeting Space</Checkbox></li>
    <li><Checkbox bind:checked={$coworking}>Co-working Space</Checkbox></li>
    <li><Checkbox bind:checked={$common}>Common Space</Checkbox></li>
    <li><Checkbox bind:checked={$atelier}>Private Space</Checkbox></li>
  </ul>
  <header><span>Action</span></header>
  <ul>
    {#each Object.values(projects) as project }
      {#if !project.frontmatter.archived }
        <li
          class:current={$details.project === project}
          class="action {checkLocation(project.frontmatter.location) ? '' : 'disabled'}"
          on:click={() => {
            $scale.zoom = $scale.max;
              $pos = { 
                x: -(project.frontmatter.coordinates.x * $scale.zoom + 2200),
                y: -(project.frontmatter.coordinates.y * $scale.zoom + 1500)
              };
              $details.project = project;
              $details.visible = true;
            }}
        >
          {project.frontmatter.action}
        </li>
      {/if}
    {/each}
  </ul>
</div>

<style>
  .filters {
    border-right: 1px solid black;
    background-color: white;
    height: 100%;
    width: 100%;
    overflow-y: auto;
  }

  .current {
    font-weight: bold;
  }

  header {
    display: flex;
    align-items: center;
    font-weight: bold;
    color: black;
    margin: 24px 16px 8px 16px;
    border-bottom: 1px solid black;
  }

  header span {
    margin-bottom: 4px;
  }

  ul {
    list-style: none;
    padding-left: 1rem;
  }

  li {
    margin: 0.25rem 0;
  }

  li.action {
    cursor: pointer;
  }

  li.action::before {
    content: "> ";
    margin-right: 0.25rem;
  }

  li.action:hover {
    font-weight: bold;
  }

  li.action.disabled {
    opacity: 0;
  }
</style>
