<header>
  <h1>
    <a href="/" class="outline">How toGether</a>
  </h1>
  <nav>
    <a class="outline" href="/info">info</a>
    <a class="outline" href="/archive">archive</a>
  </nav>
</header>

<style>
  h1 {
    margin: 1rem;
    letter-spacing: .5px;
  }

  h1 a:hover {
    text-decoration: none;
    -webkit-text-fill-color: var(--black);
  }

  nav {
    margin: 1rem;
    font-size: 4rem;
    letter-spacing: -1.4px;
  }

  header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    border-bottom: var(--border);
  }

  @media screen and (max-width: 1024px) {
    h1, nav {
      font-size: 3rem;
    }
  }

  @media screen and (max-width: 600px) {
    h1, nav {
      font-size: 2rem;
    }
  }
</style>