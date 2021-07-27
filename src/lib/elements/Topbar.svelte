<script>
  import { createEventDispatcher } from 'svelte';

  export let text
  export let action = "";

  const dispatch = createEventDispatcher();
</script>

<header>
  <div>
    { text }
  </div>
  <button on:click="{() => dispatch('action', 'action')}">
    { action }
  </button>
</header>

<style>
  header {
    background-color: var(--black);
    color: white;
    padding: .25rem .5rem;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  button {
    appearance: none;
    -webkit-appearance: none;

    color: inherit;
    background-color: inherit;
    font-size: inherit;
    vertical-align: inherit;
    border: none;
    padding: 0;
    margin: 0;
    outline: 0;

    cursor: pointer;
    letter-spacing: 1px;
  }

  button:hover {
    text-shadow: 1px 0 0 white;
  }
</style>