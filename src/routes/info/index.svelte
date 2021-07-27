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
  import Sidebar from "$lib/elements/Sidebar.svelte"
  import Chapters from "$lib/elements/Chapters.svelte"
  import Info from "$lib/elements/Info.svelte"
  
  export let info

  let chapters = Object.keys(info)
  let infoObjects = Object.entries(info)
</script>

<Sidebar>
  <Chapters { chapters } />
</Sidebar>

<div>
  {#each infoObjects as info}
    <Info info={info[1]} id={info[0]} />
  {/each}
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    width: 100%;

    background-image:  linear-gradient(#eee 2px, transparent 2px), linear-gradient(90deg, #eee 2px, transparent 2px), linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, white 1px);
    background-size: 10rem 10rem, 10rem 10rem, 2rem 2rem, 2rem 2rem;
    background-position: 2rem 2rem;
  }
</style>