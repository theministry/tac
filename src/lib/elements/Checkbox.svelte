<script>
  export let checked = false;
  export let disabled = false;
</script>

<label>
  <input type="checkbox" bind:checked {disabled} />

  <div
    class="box"
    style="
      background-color: {disabled
      ? '#999'
      : checked
      ? 'rgb(199,175,79)'
      : 'white'};
      border: 2px solid {disabled ? '#999' : 'black'};
    "
  />

  <div class="label"><slot /></div>
</label>

<style>
  label {
    width: 100%;
    line-height: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0;
    cursor: pointer;
    position: relative;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
  }

  input {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    opacity: 0;
    margin: 0;
    padding: 0;
  }

  .box {
    width: 10px;
    height: 10px;
    margin-right: 0.25rem;
  }

  .label {
    height: 100%;
    flex-grow: 1;
    margin-left: 4px;
  }
</style>
