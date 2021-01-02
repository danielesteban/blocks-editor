<script>
  import CodeMirror from 'codemirror';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Dialog from './dialog.svelte';

  export let isOpen;

  const dispatch = createEventDispatcher();

  const options = {
    mapping: [
      '// This will be called for every voxel in the volume with:',
      '// `x`, `y`, `z` and `color` and receives a blocktype.',
      '// ex: Map by height',
      '// return y > 10 ? 1 : 2;',
      '// ex: Map by lightness',
      '// return color.l > 0.5 ? 1 : 2;',
      'return 1;',
    ].join('\n'),
    scale: 1,
    threshold: 1,
    flipX: false,
    flipZ: false,
    zUp: false,
  };

  const onVoxelize = () => {
    dispatch('voxelize', {
      scale: parseFloat(options.scale),
      threshold: parseInt(options.threshold, 10),
      flipX: !!options.flipX,
      flipZ: !!options.flipZ,
      zUp: !!options.zUp,
      mapping: options.mapping,
    });
    isOpen = false;
  };

  let textarea;
  let codemirror;
  $: if (isOpen && textarea && !codemirror) {
    codemirror = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      lineWrapping: true,
      mode: 'javascript',
      theme: 'monokai',
      viewportMargin: Infinity,
    });
    codemirror.on('change', () => {
      options.mapping = codemirror.getValue();
    });
  }
  $: if (!isOpen && codemirror) {
    codemirror.toTextArea();
    codemirror = null;
  }

  onDestroy(() => {
    codemirror.toTextArea();
    codemirror = null;
  });
</script>

<Dialog bind:isOpen={isOpen}>
  <div class="value">
    <label>Scale</label>
    <input type="number" min="0" step="0.1" bind:value={options.scale} />
  </div>
  <div class="value">
    <label>Threshold</label>
    <input type="number" min="1" step="1" bind:value={options.threshold} />
  </div>
  <div class="value">
    <label>FlipX</label>
    <input type="checkbox" bind:checked={options.flipX} />
  </div>
  <div class="value">
    <label>FlipZ</label>
    <input type="checkbox" bind:checked={options.flipZ} />
  </div>
  <div class="value">
    <label>zUp</label>
    <input type="checkbox" bind:checked={options.zUp} />
  </div>
  <br />
  <label>Mapping function</label>
  {#if isOpen}
    <div class="code">
      <textarea bind:this={textarea}>{options.mapping}</textarea>
    </div>
  {/if}
  <div class="submit">
    <button on:click={onVoxelize}>
      Voxelize
    </button>
  </div>
</Dialog>

<style>
  .code {
    height: 200px;
  }

  .value > input[type="number"] {
    width: 100%;
    margin: 0 0 0.5rem;
  }

  .submit {
    margin: 1rem 0;
    text-align: center;
  }
</style>
