<script>
  export let lighting;
</script>

<tools>
  <label>
    Sunlight:
    <input
      type="range"
      bind:value={$lighting.sunlight}
      min={0}
      max={1}
      step={0.01}
    />
  </label>
</tools>

<style>
  tools {
    display: flex;
    background: #222;
    padding: 1rem 0.5rem;
  }

  tools > label {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
  }
  
  tools > label > input[type="range"] {
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
    width: 220px;
  }
</style>
