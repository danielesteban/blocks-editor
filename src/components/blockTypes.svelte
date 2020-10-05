<script>
  import Texture from './texture.svelte';

  export let editor;
  export let selected;
  export let textures;
  export let types;

  const onEdit = (type) => {
    if ($editor !== type) {
      editor.open(type);
    }
  };

  const onClone = (type) => {
    types.clone(type);
    selected = $types.length - 1;
    editor.open(selected);
  };

  const onRemove = (type) => {
    if (!confirm('Are you sure?')) {
      return;
    }
    editor.close();
    selected = 0;
    types.remove(type);
  };
</script>

{#each $types as type, i (type.key)}
  <blockType
    class:selected={selected === i}
    on:click={() => {
      selected = i;
      if ($editor !== selected) {
        editor.close();
      }
    }}
  >
    <texture>
      <Texture
        isTransparent={type.isTransparent}
        pixels={$textures[i].top}
      />
    </texture>
    <info>
      <name>{type.name}</name>
      <modifiers>
        {type.isTransparent ? 'transparent' : ''}
        {type.isTransparent && type.isLight ? ' | ' : ''}
        {type.isLight ? 'emits light' : ''}
        &nbsp;
      </modifiers>
      <actions>
        <button on:click={() => onEdit(i)}>
          Edit
        </button>
        <button on:click={(e) => { e.stopPropagation(); onClone(i); }}>
          Clone
        </button>
        <button
          on:click={(e) => { e.stopPropagation(); onRemove(i); }}
          disabled={$types.length <= 1}
        >
          Remove
        </button>
      </actions>
    </info>
  </blockType>
{/each}

<style>
  blockType {
    display: flex;
    padding: 1rem;
    background: #222;
    border-bottom: 1px solid #111;
  }

  blockType.selected {
    background: #363;
  }

  texture {
    display: block;
    width: 64px;
    height: 64px;
    background: #000;
    border: 4px solid #222;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
    margin-right: 1rem;
  }

  info {
    display: block;
    overflow: hidden;
    flex-grow: 1;
  }

  name {
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  modifiers {
    display: block;
    color: #999;
  }

  actions {
    display: flex;
    width: 100%;
    justify-content: space-between;
    padding: 0.25rem 0;
  }
  
  actions > button {
    padding: 0.125rem 0.75rem;
  }
</style>