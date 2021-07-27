<script context="module">
  export async function load({ page, fetch, session, context }) {
    const res = await fetch(`/data.json`);
    if (res.ok) {
      const projects = await res.json();
      return { props: projects };
    }
    return { status: 404, error: new Error("Page not found") };
  }
</script>

<script>
  import { setContext, onMount } from "svelte";
  import Project from "$lib/elements/Project.svelte"

  import { browser } from '$app/env';

  export let projects
  
  if (browser) {
    onMount(async () => {
      const wg = await import('animate-css-grid')
      const wrapGrid = wg.default
      wrapGrid.wrapGrid(document.querySelector('.projects'));
    })
  }
  
  setContext("projects", projects)
</script>

<div class="bg">
  <div 
    class="projects"
  >
    {#each Object.values(projects) as project (project) }
      <Project expandable { project } />
    {/each}
  </div>
</div>

<style>
  .bg {
    width: 100%;
    background-color: white;

    background-image:  linear-gradient(#eee 2px, transparent 2px), linear-gradient(90deg, #eee 2px, transparent 2px), linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, white 1px);
    background-size: 10rem 10rem, 10rem 10rem, 2rem 2rem, 2rem 2rem;
    background-position: 2rem 2rem;
    overflow-y: auto;
  }

  .projects {
    display: grid;
    max-width: 88rem;
    grid-template-columns: repeat(auto-fit, 20rem);
    grid-auto-rows: 20rem;
    grid-auto-flow: row dense;
    gap: 2rem;
    padding: 2rem;
    margin: 0 auto;
    justify-content: center;
  }
</style>