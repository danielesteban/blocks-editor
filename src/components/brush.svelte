<script>
  import { Color } from 'three';

  const aux = new Color();

  export let colors;

  $: color = `#${aux.setRGB(...$colors.current.slice(0, 3).map((v) => (v / 0xFF))).getHexString()}`;
  const onColor = ({ target: { value } }) => {
    aux.set(value);
    colors.setColor([
      Math.floor(aux.r * 0xFF),
      Math.floor(aux.g * 0xFF),
      Math.floor(aux.b * 0xFF),
      0xFF,
    ], true);
  };
</script>

<brush>
  <label>
    Color
    <input
      type="color"
      value={color}
      on:change={onColor}
    />
  </label>
</brush>

<style>
  brush {
    display: flex;
    background: #222;
    justify-content: space-between;
    padding: 0.25rem 1rem 0.5rem;
  }

  brush > label {
    display: flex;
    flex-direction: column;
  }
</style>
