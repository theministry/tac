<script>
  import { fly } from 'svelte/transition';
</script>

<aside transition:fly={{ x: -100 }}>
  <slot>
    empty sidebar
  </slot>
</aside>

<style>
  aside {
    width: 14rem;
    max-width: 14rem;
    border-right: var(--border);
    display: flex;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;
  }

  @media screen and (max-width: 800px) {
    aside {
      display: none;
    }
  }
</style>