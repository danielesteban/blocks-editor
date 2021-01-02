<script>
  import Voxelizer from './voxelizer.svelte';

  export let blocks;

  const onExport = () => blocks.gltf('model');
  
  const onLoad = () => blocks.load();

  const onLightmap = () => blocks.computeLightmap('lightmap');

  const onOcclusion = () => blocks.computeOcclusion('occlusion');

  const onPhysics = () => blocks.computePhysics('physics');

  const onSave = () => blocks.save('blocks');

  let isShowingVoxelizerDialog = false;
  const showVoxelizerDialog = () => { isShowingVoxelizerDialog = true; };
  const onVoxelize = ({ detail: options }) => blocks.voxelize(options);
</script>

<tools>
  <div>
    <button on:click={onLoad}>
      Load
    </button>
    <button on:click={onSave}>
      Save
    </button>
    <button on:click={showVoxelizerDialog}>
      Import
    </button>
  </div>
  <div>
    <div>
      <button on:click={onLightmap}>
        Lightmap
      </button>
      <button on:click={onOcclusion}>
        Occlusion
      </button>
    </div>
    <button on:click={onExport}>
      Export Model
    </button>
    <button on:click={onPhysics}>
      Export Physics
    </button>
  </div>
</tools>

<Voxelizer
  bind:isOpen={isShowingVoxelizerDialog}
  on:voxelize={onVoxelize}
/>

<style>
  tools {
    display: flex;
    flex-direction: column;
    background: #222;
    padding: 0.25rem 0;
  }

  tools > div {
    display: flex;
    background: #222;
    padding: 0.25rem;
  }

  tools > div > button {
    width: calc(100% / 3);
  }

  tools > div > div {
    display: flex;
    flex-direction: column;
  }

  tools > div > div > button:first-child {
    margin-bottom: 0.25rem;
  }

  tools > div > div > button:last-child {
    margin-top: 0.25rem;
  }

  button {
    flex-grow: 1;
    flex-shrink: 1;
    margin: 0 0.5rem;
  }
</style>
