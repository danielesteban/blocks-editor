<script>
  export let color;
</script>

<color>
  <bg>
    <div
      style="background: rgb(255, 255, 255)"
    />
    <div
      style="background: rgb(204, 204, 204)"
    />
    <div
      style="background: rgb(204, 204, 204)"
    />
    <div
      style="background: rgb(255, 255, 255)"
    />
  </bg>
  <tint
    style="background: rgba({color.slice(0, 3).join(',')},{color[3] / 0xFF})"
  />
</color>

<style>
  color {
    display: block;
    position: relative;
    width: 24px;
    height: 24px;
    border: 1px solid #222;
    border-radius: 4px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  bg, tint {
    display: flex;
    flex-wrap: wrap;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  bg > div {
    display: block;
    width: 12px;
    height: 12px;
  }
</style>
