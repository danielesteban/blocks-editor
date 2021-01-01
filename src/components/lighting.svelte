<script>
  import { Color } from 'three';

  const color = new Color();

  export let lighting;

  $: ambient = `#${color.copy($lighting.ambient).getHexString()}`;
  $: background = `#${color.copy($lighting.background).getHexString()}`;
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
    Ambient
    <input
      type="color"
      value={ambient}
      on:change={update('ambient')}
    />
  </label>
  <label>
    Sunlight
    <input
      type="color"
      value={sunlight}
      on:change={update('sunlight')}
    />
  </label>
  <label>
    Sky
    <input
      type="color"
      value={background}
      on:change={update('background')}
    />
  </label>
</channels>
<channels>
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
    justify-content: space-between;
    padding: 0.5rem 1rem 0.75rem;
  }

  channels > label {
    display: flex;
    flex-direction: column;
  }
</style>
