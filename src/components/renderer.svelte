
<script>
  import { onDestroy, onMount } from 'svelte';
  import {
    ACESFilmicToneMapping,
    Clock,
    Group,
    PerspectiveCamera,
    Scene,
    sRGBEncoding,
    WebGLRenderer,
  } from 'three';

  export let initialPosition = { x: 0, y: 0, z: 0 };
  export let alpha = false;
  export let controls = undefined;
  export let scene = new Scene();
  let canvas;
  let renderer;
  let viewport;

  const clock = new Clock();

  const camera = new PerspectiveCamera(70, 1, 0.01, 100);
  const player = new Group();
  player.position.copy(initialPosition);
  player.add(camera);
  scene.add(player);
  player.camera = camera;
  scene.player = player;

  let lastControls;
  $: if (controls !== lastControls) {
    lastControls = controls;
    controls.setup({ player, renderer });
  }

  scene.onBeforeRender = (renderer, scene, camera) => {
    if (controls) {
      controls.onAnimationTick({
        animation: renderer.animation,
        camera,
        player,
        viewport,
      });
    }
  };

  onDestroy(() => {
    renderer.dispose();
    renderer.forceContextLoss();
  });

  onMount(() => {
    renderer = new WebGLRenderer({
      canvas,
      alpha,
      antialias: true,
      stencil: false,
      powerPreference: 'high-performance',
    });
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setAnimationLoop(onAnimationTick);
    requestAnimationFrame(onResize);
  });

  const onAnimationTick = () => {
    renderer.animation = {
      delta: Math.min(clock.getDelta(), 1 / 30),
      time: clock.oldTime / 1000,
    };
    renderer.render(scene, camera);
  };

  const onResize = () => {
    viewport = canvas.parentNode.getBoundingClientRect();
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    onAnimationTick();
  };
</script>

<svelte:window on:resize={onResize} />
<canvas
  bind:this={canvas}
  on:mousedown={() => (
    controls && controls.request && controls.request()
  )}
/>
