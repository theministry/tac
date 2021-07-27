<script context="module">
  export async function load({ page, fetch, session, context }) {
    const res = await fetch(`/data.json`);
    if (res.ok) {
      const {projects, info} = await res.json();
      return { props: {projects, info} };
    }
    return { status: 404, error: new Error("Page not found") };
  }
</script>

<script>
  import { setContext } from "svelte";

  import Filters from "$lib/elements/Filters.svelte";
  import Sidebar from '$lib/elements/Sidebar.svelte';
  import Map from '$lib/elements/map/Map.svelte';

  export let projects
  export let info

  setContext("projects", projects)
  setContext("info", info)
</script>

<Sidebar>
  <Filters { projects } />
</Sidebar>

<Map />
