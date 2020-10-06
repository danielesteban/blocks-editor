<script>
  export let blocks;

  const onExport = () => blocks.gltf('blocks');
  
  const onLoad = () => blocks.load();

  const onSave = () => blocks.save('blocks');

  const onReset = () => {
    if (!confirm('Are you sure?')) {
      return;
    }
    blocks.reset();
  };
</script>

<tools>
  <button on:click={onLoad}>
    Load
  </button>
  <button on:click={onSave}>
    Save
  </button>
  <button on:click={onExport}>
    Export
  </button>
  <button on:click={onReset}>
    Reset
  </button>
</tools>

<style>
  tools {
    display: flex;
    background: #222;
    padding: 1rem 0.5rem;
  }

  button {
    flex-grow: 1;
    flex-shrink: 1;
    margin: 0 0.5rem;
  }
</style>
