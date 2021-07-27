<script>
  import { createEventDispatcher } from 'svelte';
  import marked from 'marked';
  import { getLocation } from '$lib/util/location'
  
  import Topbar from '$lib/elements/Topbar.svelte'
  import Carousel from '$lib/elements/Carousel.svelte'
  
  export let project
  
  export let collapsed = false;
  
  const dispatch = createEventDispatcher();

  const { name, action, images, author } = project.frontmatter
  const location = getLocation(project.frontmatter.location)
  const id = ("000" + project.frontmatter.id).slice(-3)
  const content = marked( project.content )

  const expand = () => {
    collapsed = false;
    dispatch('action')
  }

  const collapse = () => {
    collapsed = true;
    dispatch('action')
  }

</script>

<div 
  class="project"
>

  <Topbar 
    text = { `${id}. ${name} / ${action}` }
    action = { collapsed ? "" : "/ X"}
    on:action = { collapsed ? expand : collapse }
  />
  
    <main
      on:click = { collapsed ? expand : "" }
    >
    <Carousel { images } />

    {#if collapsed}
      <p>Instructions by { author }</p>
    {:else}
      <h4>{ name }</h4>
      <h3 class="location">{ location }</h3>
      <h3 class="action outline">{ action }</h3>
      <h4>Instructions by { author }</h4>
      <div class="content">{@html content }</div>
    {/if}
  </main>
</div>

<style>
  .project {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex-grow: 1;
    max-height: 100%;
  }

  main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    overflow-y: auto;
  }

  .content {
    margin-bottom: 2rem;
  }

  h4 {
    text-transform: uppercase;
    font-size: 1.5rem;
    margin: 2rem 0;
  }

  h3 {
    font-size: 4rem;
    margin-left: 1rem;
    text-transform: lowercase;
    font-weight: normal;
  }

  h3.location {
    margin-bottom: -1rem;
  }

  h3::after {
    margin-left: 1rem; 
    font-size: 1rem;
    height: 1rem;
    line-height: 1rem;
    -webkit-text-stroke: 0;
    -webkit-text-stroke-width: 0;
    -webkit-text-fill-color: currentColor;
  }

  h3.location::after {
    content: "/ location"
  } 

  h3.action::after {
    content: "/ action"
  }

  p {
    margin-top: .5rem;
    margin-bottom: -.5rem;
  }
</style>