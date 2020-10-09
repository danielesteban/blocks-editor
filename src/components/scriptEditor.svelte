<script>
  import { onMount, onDestroy } from 'svelte';
  import CodeMirror from 'codemirror';
  import 'codemirror/mode/javascript/javascript';
  import 'codemirror/lib/codemirror.css';
  import 'codemirror/theme/monokai.css';

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
      currentScript.split('\n').forEach((line) => {
        console.log(`'${line}',`)
      });
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

<code>
  <textarea bind:this={textarea}>{$script}</textarea>
</code>
<tools>
  <button on:click={onRun}>
    Run
  </button>
</tools>

<style>
  code {
    height: calc(100% - 86px)
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
