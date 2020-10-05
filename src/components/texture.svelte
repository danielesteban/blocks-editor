<script>
  import { onMount } from 'svelte';

  export let isTransparent;
  export let pixels;

  const size = { x: 16, y: 16 };
  const scale = { x: 4, y: 4 };

  let bg;
  let canvas;
  let ctx;

  onMount(() => {
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    {
      const ctx = bg.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const pScale = { x: scale.x * 0.5, y: scale.y * 0.5 };
      for (let y = 0; y < size.y; y += 1) {
        for (let x = 0; x < size.x; x += 1) {
          const p = { x: x * scale.x, y: y * scale.y };
          for (let py = 0; py < 2; py += 1) {
            for (let px = 0; px < 2; px += 1) {
              ctx.fillStyle = (px - py) % 2 === 0 ? 'rgb(255,255,255)' : 'rgb(204,204,204)';
              ctx.fillRect(
                p.x + px * pScale.x,
                p.y + py * pScale.y,
                pScale.x, pScale.y
              );
            }
          }
        }
      }
    }
  });

  $: if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0, y = 0; y < size.y; y += 1) {
      for (let x = 0; x < size.x; x += 1, i += 4) {
        const alpha = isTransparent ? pixels[i + 3] / 0xFF : 1;
        ctx.fillStyle = `rgba(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]},${alpha})`;
        ctx.fillRect(
          x * scale.x, y * scale.y,
          scale.x, scale.y
        );
      }
    }
  }
</script>

<texture>
  <canvas
    bind:this={bg}
    width={size.x * scale.x}
    height={size.y * scale.y}
  />
  <canvas
    bind:this={canvas}
    class="pixels"
    width={size.x * scale.x}
    height={size.y * scale.y}
  />
</texture>

<style>
  texture {
    display: block;
    position: relative;
  }

  canvas {
    display: block;
  }

  canvas.pixels {
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
