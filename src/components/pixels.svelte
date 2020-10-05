<script>
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  export let brush;
  export let color;
  export let noise;
  export let isTransparent;
  export let pixels;
  export let showGrid;

  const size = { x: 16, y: 16 };
  const scale = { x: 20, y: 20 };

  let bg;
  let canvas;
  let ctx;
  let grid;

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
    {
      const ctx = grid.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.strokeStyle = 'rgba(25,25,25,0.25)';
      for (let y = 0; y < size.y; y += 1) {
        for (let x = 0; x < size.x; x += 1) {
          ctx.strokeRect(
            x * scale.x, y * scale.y,
            scale.x, scale.y
          );
        }
      }
    }
  });

  let lastPixel;
  let lastColor;
  $: if (color !== lastColor) {
    lastColor = color;
    lastPixel = undefined;
  }

  let lastPixels;
  let lastOpacity;
  $: if (
    ctx
    && (
      pixels !== lastPixels
      || isTransparent !== lastOpacity
    )
  ) {
    lastPixels = pixels;
    lastOpacity = isTransparent;
    lastPixel = undefined;
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

  $: brushOffsets = [...Array(brush ** 2)]
    .map((v, i) => ({ x: Math.floor(i % brush), y: Math.floor(i / brush) }))
    .reduce((offsets, { x, y }) => {
      const radius = brush * 0.5;
      x -= radius;
      y -= radius;
      if (Math.sqrt((x ** 2) + (y ** 2)) < radius) {
        offsets.push({ x, y });
      }
      return offsets;
    }, []);

  let isDrawing = false;
  const onMouseMove = ({ clientX, clientY }) => {
    if (!isDrawing) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / (rect.right - rect.left) * canvas.width) / scale.x);
    const y = Math.floor(((clientY - rect.top) / (rect.bottom - rect.top) * canvas.height) / scale.y);
    const pixel = ((size.x * y) + x) * 4;
    if (pixel !== lastPixel) {
      lastPixel = pixel;
      brushOffsets.forEach((offset) => {
        const px = offset.x + x;
        const py = offset.y + y;
        if (px < 0 || px >= size.x || py < 0 || py >= size.y) {
          return;
        }
        const pixel = ((size.x * py) + px) * 4;
        const rgba = [
          ...color.slice(0, 3),
          (isTransparent ? color[3] : 0xFF),
        ];
        if (noise) {
          const intensity = ((color[0] + color[1] + color[2]) / 3) * noise * 2;
          for (let i = 0; i < 3; i += 1) {
            rgba[i] = Math.floor(rgba[i] + (Math.random() - 0.5) * intensity);
          }
        }
        pixels[pixel] = rgba[0];
        pixels[pixel + 1] = rgba[1];
        pixels[pixel + 2] = rgba[2];
        pixels[pixel + 3] = rgba[3];
        ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] / 0xFF})`;
        if (isTransparent) {
          ctx.clearRect(
            px * scale.x,
            py * scale.y,
            scale.x, scale.y
          );
        }
        ctx.fillRect(
          px * scale.x,
          py * scale.y,
          scale.x, scale.y
        );
      });
      dispatch('update', pixels);
    }
  };
  const onMouseDown = (e) => {
    isDrawing = true;
    onMouseMove(e);
  };
  const onMouseUp = () => {
    isDrawing = false;
  };
</script>

<svelte:window on:blur={onMouseUp} on:mouseup={onMouseUp} />

<pixels>
  <canvas
    bind:this={bg}
    width={size.x * scale.x}
    height={size.y * scale.y}
  />
  <canvas
    class="pixels"
    bind:this={canvas}
    width={size.x * scale.x}
    height={size.y * scale.y}
    on:mousedown={onMouseDown}
    on:mousemove={onMouseMove}
  />
  <canvas
    class="grid"
    class:visible={showGrid}
    bind:this={grid}
    width={size.x * scale.x}
    height={size.y * scale.y}
  />
</pixels>

<style>
  pixels {
    display: block;
    position: relative;
  }

  canvas {
    display: block;
  }

  canvas.pixels, canvas.grid {
    position: absolute;
    top: 0;
    left: 0;
  }

  canvas.grid {
    display: none;
    pointer-events: none;
  }

  canvas.grid.visible {
    display: block;
  }
</style>
