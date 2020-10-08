<script>
  const keys = [
    ['Left Click', 'Place block'],
    ['Right Click', 'Remove block'],
    ['Middle Click', 'Pick block'],
    ['spacing'],
    ['W', 'Forwards'],
    ['A', 'Leftwards'],
    ['S', 'Backwards'],
    ['D', 'Rightwards'],
    ['Shift', 'Downwards'],
    ['Spacebar', 'Upwards'],
    ['spacing'],
    ['H', 'Toggle this help'],
  ];

  export let isLocked;
  let isVisible = true;
  const onKeydown = ({ keyCode, repeat, target }) => {
    if (
      !repeat
      && keyCode === 72
      && !['INPUT', 'TEXTAREA'].includes(target.tagName.toUpperCase())
    ) {
      isVisible = !isVisible;
    }
  };
</script>

<svelte:window on:keydown={onKeydown} />

<help class:visible={isVisible && !isLocked}>
  {#each keys as [key, action]}
    {#if key === 'spacing'}
      <spacing />
    {:else}
      <action>
        <key>{key}</key>
        <div>{action}</div>
      </action>
    {/if}
  {/each}
</help>

<style>
  help {
    position: absolute;
    top: 1rem;
    right: 1rem;
    pointer-events: none;
    display: none;
  }

  help.visible {
    display: block;
  }

  action {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  key {
    width: 80px;
    white-space: nowrap;
    margin-right: 1rem;
    color: #aaa;
  }

  spacing {
    display: block;
    height: 1rem;
  }
</style>