<script>
  import { onMount, onDestroy } from 'svelte';
  import { Vector3 } from 'three';
  import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
  import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
  import DesktopControls from './controls.svelte';
  import Help from './help.svelte';
  import Renderer from './renderer.svelte';
  import Grid from '../renderables/grid';
  import Voxels from '../renderables/voxels';

  export let atlas;
  export let editor;
  export let lighting;
  export let script;
  export let selected;
  export let types;

  let controls;
  let isLocked;
  let scene;

  const initialPosition = { x: 0, y: 8, z: 24 };
  const worker = new Worker('blocks.worker.js');
  const subchunks = new Map();
  const children = [];
  worker.addEventListener('message', ({ data: message }) => {
    switch (message.type) {
      case 'chunk':
        message.subchunks.forEach((geometries, subchunk) => {
          subchunk = {
            ...message.position,
            y: subchunk,
          };
          const key = `${subchunk.x}:${subchunk.y}:${subchunk.z}`;
          let voxels = subchunks.get(key);
          if (!voxels) {
            voxels = new Voxels(subchunk);
            scene.add(voxels);
            subchunks.set(key, voxels);
          }
          voxels.update(geometries);
        });
        children.length = 0;
        [...subchunks.values()].forEach(({ meshes }) => (
          ['ghost', 'opaque', 'transparent'].forEach((key) => {
            if (meshes[key].visible) {
              children.push(meshes[key]);
            }
          })
        ));
        break;
      case 'lightmap':
        onLightmap(message.lightmap);
        break;
      case 'physics':
        onPhysics(message.boxes);
        break;
      case 'pick':
        onPick(message.block);
        break;
      case 'save':
        onSave(message.chunks);
        break;
      default:
        break;
    }
  });

  $: Voxels.updateAtlas($atlas);

  $: worker.postMessage({
    type: 'types',
    types: $types,
  });

  $: worker.postMessage({
    type: 'lighting',
    channels: $lighting,
  });

  const loader = document.createElement('input');
  loader.accept = 'application/json';
  loader.type = 'file';
  loader.style.display = 'none';
  document.body.appendChild(loader);
  export const load = () => {
    loader.onchange = ({ target: { files: [file] } }) => {
      const reader = new FileReader();
      reader.onload = () => {
        let serialized;
        try {
          serialized = JSON.parse(reader.result);
        } catch (e) {
          return;
        }
        types.deserialize(serialized.types);
        editor.close();
        $lighting = serialized.lighting;
        $script = serialized.script;
        selected = 0;
        children.length = 0;
        [...subchunks.values()].forEach(({ meshes }) => {
          meshes.ghost.visible = false;
          meshes.opaque.visible = false;
          meshes.transparent.visible = false;
        });
        worker.postMessage({
          type: 'load',
          types: $types,
          chunks: serialized.chunks,
        });
      };
      reader.readAsText(file);
      loader.value = null;
    };
    loader.click();
  };

  const downloader = document.createElement('a');
  downloader.style.display = 'none';
  document.body.appendChild(downloader);

  let saving;
  const onSave = (chunks) => {
    const serialized = JSON.stringify({
      types: types.serialize(),
      chunks,
      lighting: $lighting,
      script: $script,
    });
    saving.forEach((resolve) => resolve(serialized));
    saving = undefined;
  };
  export const save = (download) => new Promise((resolve) => {
    if (saving) {
      saving.push(resolve);
      return;
    }
    saving = [resolve];
    worker.postMessage({
      type: 'save',
    });
  })
    .then((serialized) => {
      if (download) {
        downloader.download = `${download}.json`;
        downloader.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
        downloader.click();
      }
      return serialized;
    });

  export const reset = () => {
    children.length = 0;
    [...subchunks.values()].forEach(({ meshes }) => {
      meshes.ghost.visible = false;
      meshes.opaque.visible = false;
      meshes.transparent.visible = false;
    });
    worker.postMessage({
      type: 'reset',
    });
  };
  
  const helpers = {
    box(x, y, z, w, h, l, type) {
      x = Math.floor(x);
      y = Math.floor(y);
      z = Math.floor(z);
      for (let i = 0; i < w; i += 1) {
        for (let j = 0; j < h; j += 1) {
          for (let k = 0; k < l; k += 1) {
            helpers.update(x + i, y + j, z + k, type);
          }
        }
      }
    },
    clone(fromX, fromY, fromZ, toX, toY, toZ) {
      worker.postMessage({
        type: 'clone',
        from: {
          x: Math.floor(fromX),
          y: Math.floor(fromY) + 1,
          z: Math.floor(fromZ),
        },
        to: {
          x: Math.floor(toX),
          y: Math.floor(toY) + 1,
          z: Math.floor(toZ),
        },
      });
    },
    reset,
    sphere(x, y, z, r, type) {
      x = Math.floor(x);
      y = Math.floor(y);
      z = Math.floor(z);
      const l = Math.ceil(Math.sqrt((r ** 2) + (r ** 2) + (r ** 2)));
      const s = r * 2;
      for (let i = -l; i < l; i += 1) {
        for (let j = -l; j < l; j += 1) {
          for (let k = -l; k < l; k += 1) {
            if (Math.sqrt(((i - 0.5) ** 2) + ((j - 0.5) ** 2) + ((k - 0.5) ** 2)) < r) {
              helpers.update(x + i, y + j, z + k, type);
            }
          }
        }
      }
    },
    update(x, y, z, type) {
      x = Math.floor(x);
      y = Math.floor(y);
      z = Math.floor(z);
      if (typeof type === 'function') {
        type = type(x, y, z);
      }
      worker.postMessage({
        type: 'update',
        update: { x, y: y + 1, z, type },
      });
    },
  };

  export const runScript = () => (new Function([
    'const { noise, clone, box, reset, sphere, update } = arguments[0];',
    $script,
  ].join('\n')))({
    noise: new SimplexNoise(),
    ...helpers,
  });

  const exporter = new GLTFExporter();
  export const gltf = (download) => {
    const materials = Voxels.getExportableMaterials();
    return new Promise((resolve) => exporter.parse((
      [...subchunks.values()]
        .filter(({ meshes: { opaque, transparent } }) => (
          opaque.visible || transparent.visible
        ))
        .map((mesh) => mesh.clone(materials))
    ), (buffer) => {
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      if (download) {
        downloader.download = `${download}.glb`;
        downloader.href = URL.createObjectURL(blob);
        downloader.click();
      }
      resolve(blob);
    }, {
      binary: true,
    }));
  };

  let computingLightmap;
  const onLightmap = ({ data, origin, size }) => {
    const serialized = JSON.stringify({ data, origin, size });
    computingLightmap.forEach((resolve) => resolve(serialized));
    computingLightmap = undefined;
  };
  export const computeLightmap = (download) => new Promise((resolve) => {
    if (computingLightmap) {
      computingLightmap.push(resolve);
      return;
    }
    computingLightmap = [resolve];
    worker.postMessage({
      type: 'computeLightmap',
    });
  })
    .then((serialized) => {
      if (download) {
        downloader.download = `${download}.json`;
        downloader.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
        downloader.click();
      }
      return serialized;
    });

  let computingPhysics;
  const onPhysics = (boxes) => {
    const serialized = JSON.stringify(boxes);
    computingPhysics.forEach((resolve) => resolve(serialized));
    computingPhysics = undefined;
  };
  export const computePhysics = (download) => new Promise((resolve) => {
    if (computingPhysics) {
      computingPhysics.push(resolve);
      return;
    }
    computingPhysics = [resolve];
    worker.postMessage({
      type: 'computePhysics',
    });
  })
    .then((serialized) => {
      if (download) {
        downloader.download = `${download}.json`;
        downloader.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
        downloader.click();
      }
      return serialized;
    });

  const grid = new Grid();

  onMount(() => {
    scene.add(grid);
  });

  onDestroy(() => {
    document.body.removeChild(loader);
    document.body.removeChild(downloader);
    worker.terminate();
  });

  const blockFacings = [
    new Vector3(0, 1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
    new Vector3(-1, 0, 0),
    new Vector3(1, 0, 0),
  ];
  const getBlock = (raycaster, neighbor) => {
    const hit = raycaster.intersectObjects(children)[0] || false;
    if (!hit) {
      if (neighbor) {
        const hit = raycaster.intersectObject(grid)[0] || false;
        if (hit) {
          return hit.point
            .addScaledVector(blockFacings[0], 0.5)
            .floor();
        }
      }
      return false;
    }
    const { point, uv } = hit;
    const normal = blockFacings[Math.floor(uv.y)];
    if (!normal && neighbor) {
      return false;
    }
    if (normal) {
      point.addScaledVector(normal, (neighbor ? 1 : -1) * 0.5);
    }
    return point.floor();
  };

  const onButtons = ({ detail: { buttons, raycaster } }) => {
    const {
      primaryDown: isPlacing,
      secondaryDown: isRemoving,
      tertiaryDown: isPicking,
    } = buttons;
    if (!isPlacing && !isRemoving && !isPicking) {
      return;
    }
    const block = getBlock(raycaster, !(isPicking || isRemoving));
    if (!block) {
      return;
    }
    if (isPicking) {
      worker.postMessage({
        type: 'pick',
        block: {
          x: block.x,
          y: block.y + 1,
          z: block.z,
        },
      });
      return;
    }
    worker.postMessage({
      type: 'update',
      update: {
        x: block.x,
        y: block.y + 1,
        z: block.z,
        type: isRemoving ? 0 : selected + 1,
      },
    });
  };

  const onPick = (type) => {
    selected = type - 1;
  };
</script>

<DesktopControls
  bind:this={controls}
  bind:isLocked={isLocked}
  on:buttons={onButtons}
/>
<Renderer
  bind:scene={scene}
  controls={controls}
  initialPosition={initialPosition}
/>

<Help isLocked={isLocked} />

{#if isLocked}
  <crosshair>
    <div></div>
    <div></div>
  </crosshair>
{/if}

<style>
  crosshair {
    opacity: 0.3;
  }

  crosshair > div {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
  }

  crosshair > div:nth-child(1) {
    width: 8px;
    height: 2px;
  }

  crosshair > div:nth-child(2) {
    width: 2px;
    height: 8px;
  }
</style>
