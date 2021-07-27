<script>
  import Checkbox from "$lib/elements/Checkbox.svelte";

  import { meeting, coworking, common, atelier } from "$lib/stores/filters";
  import { pos, scale, viewport } from "$lib/stores/map";

  import { mouse } from "$lib/stores/dom"

  export let projects;

  $: checkLocation = (location) => {
    if (location === "meeting" && $meeting) return true;
    if (location === "coworking" && $coworking) return true;
    if (location === "common" && $common) return true;
    if (location === "atelier" && $atelier) return true;
  };

  const goTo = (m) => {
    scale.reset();
    pos.moveTo({ x: m.frontmatter.coordinates.x, y: m.frontmatter.coordinates.y });
  };
</script>

<div class="filters">
  <header><span>Location</span></header>
  <ul>
    <li><Checkbox bind:checked={$meeting}>Meeting Space</Checkbox></li>
    <li><Checkbox bind:checked={$coworking}>Co-working Space</Checkbox></li>
    <li><Checkbox bind:checked={$common}>Common Space</Checkbox></li>
    <li><Checkbox bind:checked={$atelier}>Atelier</Checkbox></li>
  </ul>
  <header><span>Action</span></header>
  <ul>
    {#each Object.values(projects) as project }
      <li
        class="action {checkLocation(project.frontmatter.location) ? '' : 'disabled'}"
        on:click={goTo(project)}
      >
        {project.frontmatter.action}
      </li>
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
