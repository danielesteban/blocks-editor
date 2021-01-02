<script>
  import CodeMirror from 'codemirror';
  import { onMount, onDestroy } from 'svelte';

  export let blocks;
  export let script;

  let textarea;
  let codemirror;
  let currentScript = $script;
  onMount(() => {
    codemirror = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      lineWrapping: true,
      mode: 'javascript',
      theme: 'monokai',
      viewportMargin: Infinity,
    });
    codemirror.on('change', () => {
      $script = codemirror.getValue();
      currentScript = $script;
    });
  });

  onDestroy(() => {
    codemirror.toTextArea();
  });
  
  $: if ($script !== currentScript) {
    codemirror.setValue($script);
  }

  const onRun = () => blocks.runScript();
</script>

<div class="code">
  <textarea bind:this={textarea}>{$script}</textarea>
</div>
<tools>
  <button on:click={onRun}>
    Run
  </button>
</tools>

<style>
  .code {
    height: calc(100% - 86px);
  }

  tools {
    display: flex;
    background: #222;
    justify-content: center;
    padding: 0.5rem 0;
    border-top: 2px solid #111;
  }

  tools > button {
    width: 150px;
  }
</style>
