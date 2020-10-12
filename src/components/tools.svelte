<script>
  export let blocks;

  const onExport = () => blocks.gltf('model');
  
  const onLoad = () => blocks.load();

  const onLightmap = () => blocks.computeLightmap('lightmap');

  const onPhysics = () => blocks.computePhysics('physics');

  const onReset = () => {
    if (!confirm('Are you sure?')) {
      return;
    }
    blocks.reset();
  };

  const onSave = () => blocks.save('blocks');
</script>

<tools>
  <div>
    <button on:click={onLoad}>
      Load
    </button>
    <button on:click={onSave}>
      Save
    </button>
    <button on:click={onReset}>
      Reset
    </button>
  </div>
  <div>
    <button on:click={onExport}>
      Export Model
    </button>
    <button on:click={onLightmap}>
      Export Lightmap
    </button>
    <button on:click={onPhysics}>
      Export Physics
    </button>
  </div>
</tools>

<style>
  tools {
    display: flex;
    flex-direction: column;
    background: #222;
    padding: 0.5rem 0;
  }

  tools > div {
    display: flex;
    background: #222;
    padding: 0.5rem;
  }

  button {
    flex-grow: 1;
    flex-shrink: 1;
    margin: 0 0.5rem;
  }
</style>
