<script>
  export let isOpen;
  
  const onClose = () => { isOpen = false };
</script>

<div class="dialog" class:open={isOpen}>
  <wrapper>
    <a class="close" on:click={onClose}>
      &times;
    </a>
    <content><slot /></content>
  </wrapper>
</div>

<style>
  .dialog {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, .5);
    z-index: 10;
  }

  .dialog.open {
    display: block;
  }

  wrapper {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #111;
    color: #fff;
    border: 1px solid #000;
    border-radius: 4px;
    width: 500px;
  }

  content {
    padding: 1rem;
  }

  .close {
    position: absolute;
    right: 0.75rem;
    top: 0.75rem;
    color: #999;
    cursor: pointer;
  }
</style>
