<script>
  import marked from 'marked';

  export let info
  export let id

  const title = info.frontmatter.title
  const images = info.frontmatter.images
  const content = marked( info.content )
</script>

<article id="{id.split(". ")[1]}">
  <div class="text">
    <div class="inner info markdown">
      <h4>{title}</h4>
      {@html content}
    </div>
  </div>
  <div class="images">
    <div class="inner info img">
      {#each images as image}
        <img src="{image}" alt="{image}" />
      {/each}
    </div>
  </div>
</article>

<style>
  article {
    display: flex;
  }

  h4 {
    text-transform: uppercase;
  }

  .text {
    background-color: white;
    width: 50%;

    /* boxed layout */
    /* padding: 1rem;
    border: var(--border);
    margin: 2rem; */

    /* continuous layout */
    border-right: var(--border);
    padding-bottom: 2rem;
    
  }
  
  .images {
    width: 50%;
  }

  .inner {
    width: 80%;
    margin: 2rem auto;
  }

  img {
    border: var(--border);
    width: 100%;
    height: auto;
    background-color: white;
  }

  .inner.info.img {
    text-align: center;
  }

  .inner.info.markdown {
    position: sticky;
    position: -webkit-sticky;
    top: 2rem;
  }

  :global(.inner.info > *) {
    margin-bottom: 1rem;
  }

  :global(.inner.info > h1) {
    font-size: 3rem;
  }

  @media screen and (max-width: 600px) {
    .images {
      display: none;
    }
    .text {
      width: 100%;
    }
  }
</style>
