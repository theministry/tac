<script>
  import Header from '$lib/elements/Header.svelte';
  import '../css/app.css'
  import '../css/type.css'
</script>

<Header />
<main>
  <slot />
</main>

<style>
  :global(body) {
    display: flex;
    flex-direction: column;
  }

  main {
    min-height: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: row;
  }
</style>