<script>
  import { Color } from 'three';

  const color = new Color();

  export let lighting;

  $: sunlight = `#${color.copy($lighting.sunlight).getHexString()}`;
  $: channel1 = `#${color.copy($lighting.channel1).getHexString()}`;
  $: channel2 = `#${color.copy($lighting.channel2).getHexString()}`;
  $: channel3 = `#${color.copy($lighting.channel3).getHexString()}`;

  const update = (channel) => ({ target: { value } }) => {
    color.set(value);
    $lighting[channel] = { r: color.r, g: color.g, b: color.b };
  };
</script>

<channels>
  <label>
    Sunlight
    <input
      type="color"
      value={sunlight}
      on:change={update('sunlight')}
    />
  </label>
  <label>
    Channel1
    <input
      type="color"
      value={channel1}
      on:change={update('channel1')}
    />
  </label>
  <label>
    Channel2
    <input
      type="color"
      value={channel2}
      on:change={update('channel2')}
    />
  </label>
  <label>
    Channel3
    <input
      type="color"
      value={channel3}
      on:change={update('channel3')}
    />
  </label>
</channels>

<style>
  channels {
    display: flex;
    background: #222;
    padding: 0.5rem 1rem 0.75rem;
    justify-content: space-between;
  }

  channels > label {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
