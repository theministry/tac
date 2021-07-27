<script context="module">
  export async function load({ page, fetch }) {
    const res = await fetch(`/data/projects.json`);
    if (res.ok) {
      const projects = await res.json();
      return { props: projects };
    }
    return { status: 404, error: new Error("Page not found") };
  }
</script>

<script>
  export let projects;
</script>

<div class="object">
  <h3>Projects</h3>
  <ul>
    {#each projects as project}
    <li><a href="projects/{ project }">{ project }</a></li>
    {/each}
  </ul>
</div>

<style>
  .object {
    max-width: 600px;
    margin: 0 auto;
  }
</style>