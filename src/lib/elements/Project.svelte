<script>
  import { createEventDispatcher } from 'svelte';
  import marked from 'marked';
  import { getLocation } from '$lib/util/location'
  
  import Topbar from '$lib/elements/Topbar.svelte'
  import Carousel from '$lib/elements/Carousel.svelte'
  
  export let project
  
  export let closable = false;
  export let expandable = false;
  
  let collapsed = expandable ? true : false;
  export let expanded = !collapsed;
  
  const dispatch = createEventDispatcher();

  $: name = project.frontmatter.name
  $: action = project.frontmatter.action
  $: images = project.frontmatter.images
  $: author = project.frontmatter.author
  
  $: location = getLocation(project.frontmatter.location)
  $: id = ("000" + project.frontmatter.id).slice(-3)
  $: content = marked( project.content )

  $: no_content = project.content.length === 0;

  const close = () => {
    dispatch('close')
  }

  const expand = () => {
    collapsed = false;
    expanded = true
    dispatch('expand')
  }

  const collapse = () => {
    collapsed = true;
    expanded = false
    dispatch('collapse')
  }

  const handleAction = () => {
    console.log("handling action")
    if (closable) {
      console.log("closing")
      close()
    } else if (expandable) {
      if (collapsed) {
        console.log("expanding")
        expand()
      } else {
        console.log("collapsing")
        collapse()
      }
    }
  }

</script>

<div 
  class="project"
  class:expandable
  class:expanded
  class:no_content
>
  <div class="container" >
  {#if !collapsed}
    <Topbar 
      text = { `${id}. ${name} / ${action}` }
      action = { collapsed ? "" : "/ X"}
      on:action = { handleAction }
    />
  {/if}
  <main
    on:click = { collapsed ? expand : "" }
  >
  <Carousel { images } { collapsed } />

  {#if collapsed}
    <p>Instructions by { author }</p>
  {:else}
    <h4>{ name }</h4>
    <h3 class="location">{ location }</h3>
    <h3 class="action outline">{ action }</h3>
    <h4 class="instructions">Instructions by</h4>
    <h4 class="author">{ author }</h4>
    <div class="content">{@html content }</div>
  {/if}
</main>
</div>
</div>

<style>
  .container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-width: 100%;
  }

  .expandable {
    border: var(--border);
  }

  .expandable:hover {
    outline: var(--border)
  }

  .expanded {
    outline: var(--border);
    grid-row-end: span 4;
    grid-column-end: span 2;
    transition: all ease-in-out 1s;
  }

  .expanded.no_content {
    grid-row-end: span 3;
    grid-column-end: span 2;
  }

  @media screen and (max-width: 88rem) {
    .expanded {
      max-width: 100%;
      grid-row-end: span 4;
      grid-column-end: span 1;
    }
  }

  .project {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex-grow: 1;
    max-height: 100%;
    max-width: 100%;
    background-color:white;
  }

  main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .expanded main {
    overflow-y: auto;
  }

  .content {
    margin-bottom: 2rem;
  }

  :global(.content *) {
    max-width: 100%;
  }

  :global(.content ol) {
    padding-inline-start: 16px;
  }

  h4 {
    text-transform: uppercase;
    font-size: 1.5rem;
    margin: 2rem 0 1.5rem 0;
  }

  h4.instructions {
    margin-top: 2.5rem;
    margin-bottom: 0;
  }

  h4.author {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 4rem;
    margin-left: 1rem;
    text-transform: lowercase;
    font-weight: normal;
    line-height: 3.5rem;
    letter-spacing: -1.4px;
  }

  h3.location {
    margin-bottom: 2rem;
  }

  h3::before {
    margin-left: -.5rem; 
    margin-bottom: .5rem;
    font-size: 1rem;
    height: 1rem;
    line-height: 1rem;
    letter-spacing: -0.2px;
    display: block;
    -webkit-text-stroke: 0;
    -webkit-text-stroke-width: 0;
    -webkit-text-fill-color: currentColor;
  }

  h3.location::before {
    content: "/ location"
  } 

  h3.action::before {
    content: "/ action"
  }

  p {
    margin-top: .5rem;
    margin-bottom: -.5rem;
  }
</style>
