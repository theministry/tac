<aside>
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

  @media screen and (max-width: 1024px) {
    aside {
      display: none;
    }
  }
</style>