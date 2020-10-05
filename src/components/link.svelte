<script>
  import router from '../stores/router';

  export let path;

  const onClick = (e) => {
    e.preventDefault();
    router.push(path);
  };
</script>

<a
  href={path}
  on:click={onClick}
>
  <slot></slot>
</a>
