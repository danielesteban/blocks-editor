<script>
  import { onMount, onDestroy } from 'svelte';
  import { Vector3 } from 'three';
  import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
  import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
  import SimplexNoise from 'simplex-noise';
  import DesktopControls from './controls.svelte';
  import Help from './help.svelte';
  import Renderer from './renderer.svelte';
  import Grid from '../renderables/grid';
  import Voxels from '../renderables/voxels';

  export let atlas;
  export let colors;
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
          ['alpha', 'blending', 'ghost', 'opaque', 'untextured'].forEach((key) => {
            if (meshes[key].visible) {
              children.push(meshes[key]);
            }
          })
        ));
        break;
      case 'lightmap':
        onLightmap(message.lightmap);
        break;
      case 'occlusion':
        onOcclusion(message.occlusion);
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
  loader.type = 'file';
  loader.style.display = 'none';
  document.body.appendChild(loader);
  export const load = () => {
    loader.accept = 'application/json';
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
          meshes.alpha.visible = false;
          meshes.blending.visible = false;
          meshes.ghost.visible = false;
          meshes.opaque.visible = false;
          meshes.untextured.visible = false;
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

  const gltfLoader = new GLTFLoader();
  const plyLoader = new PLYLoader();
  export const voxelize = ({ mapping, scale, threshold, flipX, flipZ, zUp }) => {
    loader.accept = '.csv,.glb,.ply';
    loader.onchange = ({ target: { files: [file] } }) => {
      const format = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
      if (!['csv', 'glb', 'ply'].includes(format)) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        children.length = 0;
        [...subchunks.values()].forEach(({ meshes }) => {
          meshes.alpha.visible = false;
          meshes.blending.visible = false;
          meshes.ghost.visible = false;
          meshes.opaque.visible = false;
          meshes.untextured.visible = false;
        });
        let parse;
        switch (format) {
          case 'csv': {
            parse = (data, done) => {
              const rows = data.split('\n').slice(1).filter((r) => r !== '');
              const position = new Float32Array(rows.length * 3);
              const color = new Float32Array(rows.length * 3);
              rows.forEach((row, i) => {
                const j = i * 3;
                const [x, y, z, /* l */, r, g, b] = row.split(',');
                position.set([x, y, z], j);
                color.set([r / 0xFF, g / 0xFF, b / 0xFF], j);
              });
              done({ position, color });
            };
            break;
          }
          case 'glb': {
            parse = (data, done) => (
              gltfLoader.parse(data, null, ({ scene }) => {
                let geometry;
                scene.updateMatrixWorld();
                scene.traverse((child) => {
                  if (!geometry && child.isMesh) {
                    child.geometry.applyMatrix4(child.matrixWorld);
                    geometry = child.geometry;
                  }
                });
                if (!geometry) {
                  return;
                }
                done({
                  position: geometry.attributes.position.array,
                  color: geometry.attributes.color ? geometry.attributes.color.array : undefined,
                });
              })
            );
            break;
          }
          case 'ply': {
            parse = (data, done) => {
              const parsed = plyLoader.parse(data);
              done({
                position: parsed.attributes.position.array,
                color: parsed.attributes.color ? parsed.attributes.color.array : undefined,
              });
            };
            break;
          }
          default:
            return;
        }
        parse(reader.result, (data) => (
          worker.postMessage({
            type: 'voxelize',
            data,
            mapping,
            scale,
            threshold,
            flipX,
            flipZ,
            zUp,
          })
        ));
      };
      if (['glb', 'ply'].includes(format)) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
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
    }, null, '  ');
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
      meshes.alpha.visible = false;
      meshes.blending.visible = false;
      meshes.ghost.visible = false;
      meshes.opaque.visible = false;
      meshes.untextured.visible = false;
    });
    worker.postMessage({
      type: 'reset',
    });
  };
  
  const helpers = {
    box(x, y, z, w, h, l, type, r, g, b) {
      x = Math.floor(x);
      y = Math.floor(y);
      z = Math.floor(z);
      for (let i = 0; i < w; i += 1) {
        for (let j = 0; j < h; j += 1) {
          for (let k = 0; k < l; k += 1) {
            helpers.update(x + i, y + j, z + k, type, r, g, b);
          }
        }
      }
    },
    clone(fromX, fromY, fromZ, toX, toY, toZ) {
      worker.postMessage({
        type: 'clone',
        from: {
          x: Math.floor(fromX),
          y: Math.floor(fromY),
          z: Math.floor(fromZ),
        },
        to: {
          x: Math.floor(toX),
          y: Math.floor(toY),
          z: Math.floor(toZ),
        },
      });
    },
    cylinder(x, y, z, axis, radius, height, type, r, g, b) {
      x = Math.floor(x);
      y = Math.floor(y);
      z = Math.floor(z);
      const l = Math.ceil(Math.sqrt((radius ** 2) + (radius ** 2) + (radius ** 2)));
      switch (axis) {
        default:
        case 'x':
          axis = [2, 1, 0];
          break;
        case 'y':
          axis = [0, 2, 1];
          break;
        case 'z':
          axis = [0, 1, 2];
          break;
      }
      for (let i = -l; i < l; i += 1) {
        for (let j = -l; j < l; j += 1) {
          if (Math.sqrt(((i - 0.5) ** 2) + ((j - 0.5) ** 2)) < radius) {
            for (let k = 0; k < height; k += 1) {
              const p = [i, j, k];
              helpers.update(x + p[axis[0]], y + p[axis[1]], z + p[axis[2]], type, r, g, b);
            }
          }
        }
      }
    },
    reset,
    sphere(x, y, z, radius, type, r, g, b) {
      x = Math.floor(x);
      y = Math.floor(y);
      z = Math.floor(z);
      const l = Math.ceil(Math.sqrt((radius ** 2) + (radius ** 2) + (radius ** 2)));
      for (let i = -l; i < l; i += 1) {
        for (let j = -l; j < l; j += 1) {
          for (let k = -l; k < l; k += 1) {
            if (Math.sqrt(((i - 0.5) ** 2) + ((j - 0.5) ** 2) + ((k - 0.5) ** 2)) < radius) {
              helpers.update(x + i, y + j, z + k, type, r, g, b);
            }
          }
        }
      }
    },
    update(x, y, z, type, r = 0xFF, g = 0xFF, b = 0xFF) {
      x = Math.floor(x);
      y = Math.floor(y);
      z = Math.floor(z);
      if (typeof type === 'function') {
        const ret = type(x, y, z);
        if (typeof ret === 'object') {
          type = ret.type;
          r = ret.r;
          g = ret.g;
          b = ret.b;
        } else {
          type = ret;
        }
      }
      r = Math.floor(r);
      g = Math.floor(g);
      b = Math.floor(b);
      worker.postMessage({
        type: 'update',
        update: { x, y, z, type, r, g, b },
      });
    },
  };

  export const runScript = () => (new Function([
    'const { SimplexNoise, clone, cylinder, box, reset, sphere, update } = arguments[0];',
    $script,
  ].join('\n')))({
    SimplexNoise,
    ...helpers,
  });

  const exporter = new GLTFExporter();
  export const gltf = (download) => {
    const materials = Voxels.getExportableMaterials();
    return new Promise((resolve) => exporter.parse((
      [...subchunks.values()]
        .filter(({ meshes: { alpha, blending, opaque, untextured } }) => (
          alpha.visible || blending.visible || opaque.visible || untextured.visible
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
  const onLightmap = ({ channels, data, origin, size }) => {
    const serialized = JSON.stringify({ channels, data, origin, size });
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

  let computingOcclusion;
  const onOcclusion = ({ data, origin, size }) => {
    const serialized = JSON.stringify({ data, origin, size });
    computingOcclusion.forEach((resolve) => resolve(serialized));
    computingOcclusion = undefined;
  };
  export const computeOcclusion = (download) => new Promise((resolve) => {
    if (computingOcclusion) {
      computingOcclusion.push(resolve);
      return;
    }
    computingOcclusion = [resolve];
    worker.postMessage({
      type: 'computeOcclusion',
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
  const background = grid.material.uniforms.fogColor.value;
  $: background.copy($lighting.background);

  onMount(() => {
    scene.background = background;
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
    onMovement({ detail: { raycaster } });
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
          y: block.y,
          z: block.z,
        },
      });
      return;
    }
    worker.postMessage({
      type: 'update',
      update: {
        x: block.x,
        y: block.y,
        z: block.z,
        type: isRemoving ? 0 : selected + 1,
        r: $colors.current[0],
        g: $colors.current[1],
        b: $colors.current[2],
      },
    });
  };

  let blockAtPointer = false;
  const onMovement = ({ detail: { raycaster } }) => {
    const block = getBlock(raycaster, false);
    blockAtPointer = block ? {
      x: block.x,
      y: block.y,
      z: block.z,
    } : false;
  };

  const onPick = ({ type, r, g, b }) => {
    selected = type - 1;
    colors.setColor([r, g, b, 0xFF], true);
  };
</script>

<DesktopControls
  bind:this={controls}
  bind:isLocked={isLocked}
  on:buttons={onButtons}
  on:movement={onMovement}
/>
<Renderer
  bind:scene={scene}
  controls={controls}
  initialPosition={initialPosition}
/>

<Help isLocked={isLocked} />

<info class:visible={isLocked}>
  {blockAtPointer ? `X: ${blockAtPointer.x} Y: ${blockAtPointer.y} Z: ${blockAtPointer.z}` : ''}
</info>

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

  info {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    pointer-events: none;
    display: none;
  }

  info.visible {
    display: block;
  }
</style>
