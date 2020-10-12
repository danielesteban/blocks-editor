<script>
  export let lighting;
</script>

<tools>
  <label>
    <span>Sunlight:</span>
    <input
      type="range"
      bind:value={$lighting.sunlight}
      min={0}
      max={1}
      step={0.01}
    />
  </label>
  <label>
    <span>Blocklight:</span>
    <input
      type="range"
      bind:value={$lighting.light}
      min={0}
      max={1}
      step={0.01}
    />
  </label>
</tools>

<style>
  tools {
    display: flex;
    flex-direction: column;
    background: #222;
    padding: 0.75rem 0.5rem;
  }

  tools > label {
    display: flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
  }

  tools > label > span {
    display: inline-block;
    width: 80px;
  }
  
  tools > label > input[type="range"] {
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
    width: 220px;
  }
</style>
