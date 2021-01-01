<script>
  import Dialog from './dialog.svelte';

  export let blocks;

  const onExport = () => blocks.gltf('model');
  
  const onLoad = () => blocks.load();

  const onLightmap = () => blocks.computeLightmap('lightmap');

  const onOcclusion = () => blocks.computeOcclusion('occlusion');

  const onPhysics = () => blocks.computePhysics('physics');

  const onSave = () => blocks.save('blocks');

  let isShowingVoxelizationDialog = false;
  const showVoxelizationDialog = () => { isShowingVoxelizationDialog = true; };

  const voxelization = {
    scale: 1,
    threshold: 1,
    flipX: false,
    flipZ: false,
    zUp: false,
  };
  const onVoxelize = () => {
    blocks.voxelize({
      scale: parseFloat(voxelization.scale),
      threshold: parseInt(voxelization.threshold, 10),
      flipX: !!voxelization.flipX,
      flipZ: !!voxelization.flipZ,
      zUp: !!voxelization.zUp,
    });
    isShowingVoxelizationDialog = false;
  };
</script>

<tools>
  <div>
    <button on:click={onLoad}>
      Load
    </button>
    <button on:click={onSave}>
      Save
    </button>
    <button on:click={showVoxelizationDialog}>
      Import
    </button>
  </div>
  <div>
    <button on:click={onExport}>
      Export Model
    </button>
    <button on:click={onPhysics}>
      Export Physics
    </button>
    <div>
      <button on:click={onLightmap}>
        Lightmap
      </button>
      <button on:click={onOcclusion}>
        Occlusion
      </button>
    </div>
  </div>
</tools>

<Dialog bind:isOpen={isShowingVoxelizationDialog}>
  <div class="value">
    <label>Scale</label>
    <input type="number" min="0" step="0.1" bind:value={voxelization.scale} />
  </div>
  <div class="value">
    <label>Threshold</label>
    <input type="number" min="1" step="1" bind:value={voxelization.threshold} />
  </div>
  <div class="value">
    <label>FlipX</label>
    <input type="checkbox" bind:checked={voxelization.flipX} />
  </div>
  <div class="value">
    <label>FlipZ</label>
    <input type="checkbox" bind:checked={voxelization.flipZ} />
  </div>
  <div class="value">
    <label>zUp</label>
    <input type="checkbox" bind:checked={voxelization.zUp} />
  </div>
  <div class="submit">
    <button on:click={onVoxelize}>
      Voxelize
    </button>
  </div>
</Dialog>

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
  
  .value > input[type="number"], .value > select {
    width: 100%;
    margin: 0 0 0.5rem;
  }

  .submit {
    margin: 1rem 0;
    text-align: center;
  }
</style>
