<script>
  import ColorPicker from './colorPicker.svelte';
  import Pixels from './pixels.svelte';

  export let editor;
  export let colors;
  export let textures;
  export let types;

  $: type = $types[$editor];
  $: typeTextures = $textures[$editor];

  let texture = 'top';
  $: if (type.model === 'cross' && texture !== 'top') {
    texture = 'top';
  }
  $: pixels = typeTextures[texture];

  let lastColor;
  const onTextureUpdate = ({ detail: pixels }) => {
    textures.update($editor, texture, pixels);
    if (
      $colors.current !== lastColor
      && !(
        $colors.palette.find(([r, g, b, a]) => (
          $colors.current[0] === r
          && $colors.current[1] === g
          && $colors.current[2] === b
          && $colors.current[3] === a
        ))
      )
    ) {
      lastColor = $colors.current;
      colors.addToPalette($colors.current);
    }
  };
</script>

<block>
  <name>
    <input
      type="text"
      value={type.name}
      on:change={({ target: { value } }) => { types.update($editor, 'name', value); }}
    />
  </name>
  <modifiers>
    <label>
      Model:
      <!-- svelte-ignore a11y-no-onchange -->
      <select
        value={type.model}
        on:change={({ target: { value } }) => { types.update($editor, 'model', value); }}
      >
        <option value="box">
          Box
        </option>
        <option value="cross">
          Cross
        </option>
      </select>
    </label>
    <label>
      <input
        type="checkbox"
        checked={type.isLight}
        on:change={({ target: { checked } }) => { types.update($editor, 'isLight', checked); }}
      />
      Emits light
    </label>
    <label>
      <input
        type="checkbox"
        checked={type.isTransparent}
        on:change={({ target: { checked } }) => { types.update($editor, 'isTransparent', checked); }}
      />
      Transparent
    </label>
  </modifiers>
</block>
<textures>
  <tabs>
    <tab
      class:selected={texture === 'top'}
      on:click={() => { texture = 'top'; }}
    >
      Top Texture  
    </tab>
    <tab
      class:disabled={type.model === 'cross'}
      class:selected={texture === 'side'}
      on:click={() => { texture = 'side'; }}
    >
      Side Texture  
    </tab>
    <tab
      class:disabled={type.model === 'cross'}
      class:selected={texture === 'bottom'}
      on:click={() => { texture = 'bottom'; }}
    >
      Bottom Texture  
    </tab>
  </tabs>
  <texture>
    <Pixels
      brush={$colors.brush}
      color={$colors.current}
      isTransparent={type.isTransparent}
      noise={$colors.noise}
      pixels={pixels}
      on:update={onTextureUpdate}
      showGrid
    />
  </texture>
</textures>
<ColorPicker
  colors={colors}
  enableOpacity={type.isTransparent}
/>

<style>
  block, textures {
    display: flex;
    flex-direction: column;
    background: #222;
  }

  tabs {
    display: flex;
    align-items: center;
    background: #222;
    border-bottom: 2px solid #111;
  }

  tab {
    padding: 0.5rem 1rem;
    border-right: 1px solid #111;
    cursor: pointer;
  }

  tab.disabled {
    color: #666;
    cursor: default;
  }

  tab.selected {
    cursor: default;
    background: #333;
  }

  texture {
    display: block;
    background: #000;
    padding: 0.5rem;
    border-bottom: 2px solid #111;
  }

  name, modifiers {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    border-bottom: 2px solid #111;
  }

  name > input {
    width: 100%;
  }

  modifiers {
    justify-content: space-evenly;
    padding: 0.5rem 0;
  }

  modifiers > label {
    display: block;
    cursor: pointer;
  }
</style>
