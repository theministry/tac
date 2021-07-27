<script context="module">
  export async function load({ page, fetch }) {
    const res = await fetch(`/data/projects/${page.params.slug}.json`);
    if (res.ok) {
      const project = await res.json();
      return { props: { project } };
    }
    return { status: 404, error: new Error("Page not found") };
  }
</script>

<script>
  import Project from '$lib/elements/Project.svelte'

  export let project;
</script>

<div class="project">
  <Project { project } closable expanded />
</div>

<style>
  .project {
    max-width: 600px;
    margin: 1rem auto;
  }
</style>
