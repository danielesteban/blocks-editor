<script>
  import { onDestroy } from 'svelte';
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

  const downloader = document.createElement('a');
  downloader.style.display = 'none';
  document.body.appendChild(downloader);

  const loader = document.createElement('input');
  loader.accept = 'image/*';
  loader.type = 'file';
  loader.style.display = 'none';
  document.body.appendChild(loader);

  onDestroy(() => {
    document.body.removeChild(loader);
    document.body.removeChild(downloader);
  });

  const image = new ImageData(16, 16);
  const renderer = document.createElement('canvas');
  renderer.width = 16;
  renderer.height = 16;
  const ctx = renderer.getContext('2d');

  const onExport = () => {
    for (let i = 0, y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1, i += 4) {
        image.data[i] = pixels[i];
        image.data[i + 1] = pixels[i + 1];
        image.data[i + 2] = pixels[i + 2];
        image.data[i + 3] = (type.hasAlpha || type.hasBlending) ? pixels[i + 3] : 0xFF;
      }
    }
    ctx.putImageData(image, 0, 0);
    renderer.toBlob((blob) => {
      downloader.download = `${type.name} - ${texture}.png`;
      downloader.href = URL.createObjectURL(blob);
      downloader.click();
    });
  };

  const onImport = () => {
    loader.onchange = ({ target: { files: [file] } }) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0, 16, 16);
          textures.update($editor, texture, ctx.getImageData(0, 0, 16, 16).data);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
      loader.value = null;
    };
    loader.click();
  };

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

  const pickColor = (rgba) => {
    colors.setColor(rgba, true);
    colors.setPicking(false);
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
      Light
    </label>
    <label>
      <input
        type="checkbox"
        checked={type.hasAlpha}
        on:change={({ target: { checked } }) => { types.update($editor, 'hasAlpha', checked); }}
      />
      Alpha
    </label>
    <label>
      <input
        type="checkbox"
        checked={type.hasBlending}
        on:change={({ target: { checked } }) => { types.update($editor, 'hasBlending', checked); }}
      />
      Blend
    </label>
    <label>
      <input
        type="checkbox"
        checked={type.isGhost}
        on:change={({ target: { checked } }) => { types.update($editor, 'isGhost', checked); }}
      />
      Ghost
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
      isPicking={$colors.picking}
      hasAlpha={type.hasAlpha || type.hasBlending}
      noise={$colors.noise}
      pickColor={pickColor}
      pixels={pixels}
      on:update={onTextureUpdate}
      showGrid
    />
  </texture>
</textures>
<tools>
  <button on:click={onImport}>
    Import
  </button>
  <button on:click={onExport}>
    Export
  </button>
</tools>
<ColorPicker
  colors={colors}
  enableOpacity={type.hasAlpha || type.hasBlending}
/>

<style>
  block, textures {
    display: flex;
    flex-direction: column;
    background: #222;
  }

  tabs, tools {
    display: flex;
    align-items: center;
    background: #222;
    border-bottom: 2px solid #111;
  }

  tools {
    justify-content: center;
    padding: 0.25rem 0;
    border-top: 2px solid #111;
  }

  tools > button {
    margin: 0 0.5rem;
    width: 8rem;
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
