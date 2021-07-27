<script>
  export let chapters = []
</script>

<div class="chapters">
  <header><span>Chapters</span></header>
  <ul>
    {#each chapters as chapter}  
      <a href="#{chapter.split(". ")[1]}" rel="external"><li>{ chapter.split(". ")[1] }</li></a>
    {/each}
  </ul>
</div>

<style>
  .chapters {
    border-right: 1px solid black;
    background-color: white;
    height: 100%;
    width: 100%;
  }

  header {
    display: flex;
    align-items: center;
    font-weight: bold;
    color: black;
    margin: 24px 16px 8px 16px;
    border-bottom: 1px solid black;
  }

  header span {
    margin-bottom: 4px;
  }

  ul {
    list-style: none;
    padding-left: 1rem;
  }

  li {
    margin: 0.25rem 0;
  }

  li::before {
    content: "> ";
    margin-right: 0.25rem;
  }
</style>