<script>
  export let images
  export let collapsed

  export let img = 0

  console.log(images)
</script>

<div class="carousel" class:collapsed >
  <img src="/img/projects/{ images[img] }" alt="{images[img]}" />
  <div class="buttons" class:collapsed>
    {#each images as image, index}
      <button on:click={() => {img = index}} class="{ img==index ? 'active' : '' }" />
    {/each}
  </div>
</div>

<style>
  .carousel {
    position: relative;
    width: calc(100% - 2rem);
    height: auto;

    border: var(--border);
    margin: 0 auto;   
    
    display: flex;
    flex-direction: row;
  }

  .collapsed {
    width: 17.5rem;
    height: 16.5rem;
    overflow: hidden;
  }

  .buttons {
    position: absolute;
    bottom: .5rem;
    right: .5rem;
  }

  .buttons.collapsed {
    display: none;
  }

  button {
    width: 1rem;
    height: 1rem;
    margin-right: .5rem;
    background: white;
    border: 2px solid black;
    border-radius: .5rem;
  }

  button:hover {
    background: black;
  }

  button.active {
    background: black;
  }

  img {
    width: 100%;
    height: auto;
  }
</style>