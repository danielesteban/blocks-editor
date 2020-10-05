<script>
  import Blocks from '../components/blocks.svelte';
  import BlockTypes from '../components/blockTypes.svelte';
  import BlockEditor from '../components/blockEditor.svelte';
  import Lighting from '../components/lighting.svelte';
  import ScriptEditor from '../components/scriptEditor.svelte';
  import Tools from '../components/tools.svelte';
  import BlockEditorStore from '../stores/blockEditor';
  import BlockTypesStore from '../stores/blockTypes';
  import ColorsStore from '../stores/colors';
  import ScriptEditorStore from '../stores/scriptEditor';

  const {
    atlas,
    lighting,
    types,
    textures,
  } = BlockTypesStore();
  const colors = ColorsStore();
  const blockEditor = BlockEditorStore();
  const script = ScriptEditorStore();

  let blocks;
  let selected = 0;
</script>

<wrapper>
  <ui>
   <heading>
      Block Types
      <button
        on:click={() => {
          types.create();
          selected = $types.length - 1;
          blockEditor.open(selected);
        }}
      >
        &plus;
      </button>
    </heading>
    <scroll>
      <BlockTypes
        bind:selected={selected}
        editor={blockEditor}
        textures={textures}
        types={types}
      />
    </scroll>
    <heading>
      Lighting
    </heading>
    <Lighting lighting={lighting} />
    <heading>
      Tools
    </heading>
    <Tools blocks={blocks} />
  </ui>
  {#if $blockEditor !== undefined}
    <ui class="blocksEditor">
      <heading>
        <button
          on:click={() => blockEditor.close()}
        >
          &times;
        </button>
      </heading>
      <BlockEditor
        editor={blockEditor}
        colors={colors}
        textures={textures}
        types={types}
      />
    </ui>
  {/if}
  <viewport>
    <Blocks
      bind:this={blocks}
      bind:selected={selected}
      atlas={atlas}
      editor={blockEditor}
      lighting={lighting}
      script={script}
      types={types}
    />
  </viewport>
  <ui class="scriptEditor">
    <heading>
      Scripting
    </heading>
    <ScriptEditor
      blocks={blocks}
      script={script}
    />
  </ui>
</wrapper>

<style>
  wrapper {
    height: 100%;
    display: flex;
    overflow: hidden;
  }

  ui {
    width: 320px;
    display: flex;
    flex-direction: column;
    border-right: 2px solid #000;
  }

  ui.blocksEditor {
    width: 336px;
  }

  ui.scriptEditor {
    width: 480px;
  }

  scroll {
    flex-grow: 1;
    overflow-y: scroll;
  }

  heading {
    display: flex;
    align-items: center;
    background: #333;
    padding: 0.5rem 1rem;
    border-top: 2px solid #111;
    border-bottom: 2px solid #111;
  }

  heading > button {
    margin-left: auto;
    padding: 0.125rem 0.75rem;
  }

  viewport {
    display: flex;
    flex-grow: 1;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
</style>
