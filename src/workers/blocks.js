// eslint-disable-next-line no-restricted-globals
const context = self;

const size = 16;
const subchunks = 5;
const maxHeight = size * subchunks;
const maxLight = 15;
const fields = {
  type: 0,
  light1: 1,
  light2: 2,
  light3: 3,
  sunlight: 4,
  count: 5,
};
const textureWidth = 16;
const textureHeight = 16;

const chunks = new Map();
const lightChannels = {
  light1: { r: 1, g: 1, b: 1 },
  light2: { r: 1, g: 1, b: 1 },
  light3: { r: 1, g: 1, b: 1 },
  sunlight: { r: 1, g: 1, b: 1 },
};
let types;

const allocate = (cx, cz) => {
  const voxels = new Uint8ClampedArray(size * size * maxHeight * fields.count);
  const heightmap = new Uint8ClampedArray(size ** 2);
  return {
    x: cx,
    z: cz,
    voxels,
    heightmap,
    hasPropagated: false,
  };
};

const getChunk = (cx, cz) => {
  const key = `${cx}:${cz}`;
  let chunk = chunks.get(key);
  if (!chunk) {
    chunk = {
      ...allocate(cx, cz),
      key,
    };
    chunks.set(key, chunk);
  }
  return chunk;
};

const getIndex = (x, y, z) => (
  ((x * size * maxHeight) + (y * size) + z) * fields.count
);

const getVoxelChunk = (origin) => (x, z) => {
  let chunk = origin;
  const nx = (x < 0 || x >= size) ? Math.floor(x / size) : 0;
  const nz = (z < 0 || z >= size) ? Math.floor(z / size) : 0;
  if (nx || nz) {
    chunk = getChunk(origin.x + nx, origin.z + nz);
    x -= size * nx;
    z -= size * nz;
  }
  return { chunk, cx: x, cz: z };
};

const voxelNeighbors = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
];
const floodLight = (origin, queue, key) => {
  const getChunk = getVoxelChunk(origin);
  const isSunLight = key === 'sunlight';
  const isTranslucent = (type) => types[type].isTranslucent;
  while (queue.length) {
    const { x, y, z } = queue.shift();
    const { chunk, cx, cz } = getChunk(x, z);
    const light = chunk.voxels[
      getIndex(cx, y, cz) + fields[key]
    ];
    voxelNeighbors.forEach((offset) => {
      const ny = y + offset.y;
      if (ny < 0 || ny >= maxHeight) {
        return;
      }
      const nx = x + offset.x;
      const nz = z + offset.z;
      const nl = light - ((isSunLight && offset.y === -1 && light === maxLight) ? 0 : 1);
      const { chunk, cx, cz } = getChunk(nx, nz);
      const voxel = getIndex(cx, ny, cz);
      if (
        !isTranslucent(chunk.voxels[voxel])
        || (
          isSunLight
          && offset.y !== -1
          && light === maxLight
          && ny > chunk.heightmap[(cx * size) + cz]
        )
        || chunk.voxels[voxel + fields[key]] >= nl
      ) {
        return;
      }
      chunk.voxels[voxel + fields[key]] = nl;
      queue.push({ x: nx, y: ny, z: nz });
    });
  }
};

const propagate = (chunk) => {
  const lightQueues = [[], [], []];
  const sunlightQueue = [];
  const top = maxHeight - 1;
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < maxHeight; y += 1) {
      for (let z = 0; z < size; z += 1) {
        const i = getIndex(x, y, z);
        const type = chunk.voxels[i];
        if (y === top && types[type].isTranslucent) {
          chunk.voxels[i + fields.sunlight] = maxLight;
          sunlightQueue.push({ x, y: top, z });
        } else if (types[type].light) {
          chunk.voxels[i + fields[`light${types[type].light}`]] = maxLight;
          lightQueues[types[type].light - 1].push({ x, y, z });
        }
      }
    }
  }
  floodLight(chunk, lightQueues[0], 'light1');
  floodLight(chunk, lightQueues[1], 'light2');
  floodLight(chunk, lightQueues[2], 'light3');
  floodLight(chunk, sunlightQueue, 'sunlight');
  chunk.hasPropagated = true;
};

const removeLight = (origin, x, y, z, key) => {
  const getChunk = getVoxelChunk(origin);
  const { chunk, cx, cz } = getChunk(x, z);
  const voxel = getIndex(cx, y, cz);
  const fill = [];
  const queue = [];
  queue.push({
    x,
    y,
    z,
    light: chunk.voxels[voxel + fields[key]],
  });
  chunk.voxels[voxel + fields[key]] = 0;
  const isSunLight = key === 'sunlight';
  while (queue.length) {
    const {
      x,
      y,
      z,
      light,
    } = queue.shift();
    voxelNeighbors.forEach((offset) => {
      const ny = y + offset.y;
      if (ny < 0 || ny >= maxHeight) {
        return;
      }
      const nx = x + offset.x;
      const nz = z + offset.z;
      const { chunk, cx, cz } = getChunk(nx, nz);
      const voxel = getIndex(cx, ny, cz);
      const nl = chunk.voxels[voxel + fields[key]];
      if (nl === 0) {
        return;
      }
      if (
        nl < light
        || (
          isSunLight
          && offset.y === -1
          && light === maxLight
          && nl === maxLight
        )
      ) {
        queue.push({
          x: nx,
          y: ny,
          z: nz,
          light: nl,
        });
        chunk.voxels[voxel + fields[key]] = 0;
      } else if (nl >= light) {
        fill.push({
          x: nx,
          y: ny,
          z: nz,
        });
      }
    });
  }
  floodLight(origin, fill, key);
};

const update = ({
  x,
  y,
  z,
  type,
}) => {
  const chunk = getChunk(
    Math.floor(x / size),
    Math.floor(z / size)
  );
  x -= size * chunk.x;
  z -= size * chunk.z;
  const {
    heightmap,
    voxels,
    hasPropagated,
  } = chunk;
  const voxel = getIndex(x, y, z);
  const current = voxels[voxel];
  voxels[voxel] = type;
  const heightIndex = (x * size) + z;
  const height = heightmap[heightIndex];
  if (type === types.air) {
    if (y === height) {
      for (let i = y - 1; i >= 0; i -= 1) {
        if (i === 0 || voxels[getIndex(x, i, z)] !== 0) {
          heightmap[heightIndex] = i;
          break;
        }
      }
    }
  } else if (height < y) {
    heightmap[heightIndex] = y;
  }
  if (hasPropagated) {
    if (types[current].light) {
      removeLight(chunk, x, y, z, `light${types[current].light}`);
    } else if (types[current].isTranslucent && !types[type].isTranslucent) {
      ['light1', 'light2', 'light3', 'sunlight'].forEach((key) => {
        if (voxels[voxel + fields[key]] !== 0) {
          removeLight(chunk, x, y, z, key);
        }
      });
    }
    if (types[type].light) {
      const key = `light${types[type].light}`;
      voxels[voxel + fields[key]] = maxLight;
      floodLight(chunk, [{ x, y, z }], key);
    } else if (types[type].isTranslucent && !types[current].isTranslucent) {
      const getChunk = getVoxelChunk(chunk);
      ['light1', 'light2', 'light3', 'sunlight'].forEach((key) => {
        const queue = [];
        if (key === 'sunlight' && y === maxHeight - 1) {
          voxels[voxel + fields[key]] = maxLight;
          queue.push({ x, y, z });
        } else {
          voxelNeighbors.forEach((offset) => {
            const ny = y + offset.y;
            if (ny < 0 || ny >= maxHeight) {
              return;
            }
            const nx = x + offset.x;
            const nz = z + offset.z;
            const { chunk, cx, cz } = getChunk(nx, nz);
            const voxel = getIndex(cx, ny, cz);
            const { light, isTranslucent } = types[chunk.voxels[voxel]];
            if (
              chunk.voxels[voxel + fields[key]] !== 0
              && (isTranslucent || (light && key !== 'sunlight'))
            ) {
              queue.push({ x: nx, y: ny, z: nz });
            }
          });
        }
        floodLight(chunk, queue, key);
      });
    }
  }
  return chunk;
};

const clone = ({ x, y, z }, to) => {
  const chunk = getChunk(
    Math.floor(x / size),
    Math.floor(z / size)
  );
  x -= size * chunk.x;
  z -= size * chunk.z;
  return update({
    ...to,
    type: chunk.voxels[getIndex(x, y, z)],
  });
};

const getLightColor = (l1, l2, l3, s, ao = 1) => {
  const color = ['r', 'g', 'b'].reduce((color, key) => {
    color[key] = Math.max(
      Math.min(
        (
          l1 ** 2 * lightChannels.light1[key]
          + l2 ** 2 * lightChannels.light2[key]
          + l3 ** 2 * lightChannels.light3[key]
          + s ** 2 * lightChannels.sunlight[key]
        ),
        1
      ),
      0.02
    ) * ao;
    return color;
  }, {});
  color.avg = (color.r + color.g + color.b) / 3;
  return color;
};

const getLighting = (
  {
    light1,
    light2,
    light3,
    sunlight,
  },
  neighbors
) => neighbors.map((neighbors) => {
  let n1 = types[neighbors[0].type].hasAO;
  let n2 = types[neighbors[1].type].hasAO;
  let n3 = (n1 && n2) || types[neighbors[2].type].hasAO;
  const ao = [n1, n2, n3].reduce((ao, n) => (
    ao - (n ? 0.1 : 0)
  ), 1);
  let c = 1;
  let l1 = light1;
  let l2 = light2;
  let l3 = light3;
  let s = sunlight;
  n1 = types[neighbors[0].type].isTranslucent;
  n2 = types[neighbors[1].type].isTranslucent;
  n3 = (n1 || n2) && types[neighbors[2].type].isTranslucent;
  [n1, n2, n3].forEach((n, i) => {
    if (n) {
      l1 += neighbors[i].light1;
      l2 += neighbors[i].light2;
      l3 += neighbors[i].light3;
      s += neighbors[i].sunlight;
      c += 1;
    }
  });
  l1 = l1 / c / maxLight;
  l2 = l2 / c / maxLight;
  l3 = l3 / c / maxLight;
  s = s / c / maxLight;
  return getLightColor(l1, l2, l3, s, ao);
});

const edges = {
  top: {
    type: 0,
    light1: 0,
    light2: 0,
    light3: 0,
    sunlight: maxLight,
  },
  bottom: {
    type: 0,
    light1: 0,
    light2: 0,
    light3: 0,
    sunlight: 0,
  },
};
const getVoxelData = (origin) => {
  const getChunk = getVoxelChunk(origin);
  return (x, y, z) => {
    if (y < 0) {
      return edges.bottom;
    }
    if (y >= maxHeight) {
      return edges.top;
    }
    const { chunk, cx, cz } = getChunk(x, z);
    const i = getIndex(cx, y, cz);
    return {
      type: chunk.voxels[i],
      light1: chunk.voxels[i + fields.light1],
      light2: chunk.voxels[i + fields.light2],
      light3: chunk.voxels[i + fields.light3],
      sunlight: chunk.voxels[i + fields.sunlight],
    };
  };
};

const isVisible = (type, neighbor) => (
  (types[type].isGhost || !types[neighbor].isGhost)
  && (
    !types[type].isCulled
    || !types[neighbor].isCulled
    || (
      (types[neighbor].hasAlpha || types[neighbor].hasBlending)
      && (
        !(types[type].hasAlpha || types[type].hasBlending)
        || type !== neighbor
      )
    )
  )
);

const chunkNeighbors = [
  { x: -1, z: -1 },
  { x: 0, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 0 },
  { x: 1, z: 0 },
  { x: -1, z: 1 },
  { x: 0, z: 1 },
  { x: 1, z: 1 },
];
const textureY = {
  from: 1 / (textureHeight + 2),
  to: (textureHeight + 1) / (textureHeight + 2),
};
const meshedChunks = new Map();
const mesh = (cx, cz) => {
  const chunk = getChunk(cx, cz);
  if (!meshedChunks.has(chunk.key)) {
    meshedChunks.set(chunk.key, chunk);
  }
  if (!chunk.hasPropagated) {
    propagate(chunk);
  }
  chunkNeighbors.forEach(({ x, z }) => {
    const neighbor = getChunk(chunk.x + x, chunk.z + z);
    if (!neighbor.hasPropagated) {
      propagate(neighbor);
    }
  });
  const get = getVoxelData(chunk);
  return [...Array(subchunks)].map((v, subchunk) => {
    const geometry = ['alpha', 'blending', 'ghost', 'opaque'].reduce((meshes, key) => {
      meshes[key] = {
        color: [],
        position: [],
        uv: [],
        index: [],
        offset: 0,
      };
      return meshes;
    }, {});
    const pushFace = (
      p1,
      p2,
      p3,
      p4,
      type,
      lighting,
      facing
    ) => {
      const texture = types[type].textures[facing % 6];
      const uvs = [
        [texture.from, facing + textureY.to],
        [texture.to, facing + textureY.to],
        [texture.to, facing + textureY.from],
        [texture.from, facing + textureY.from],
      ];
      const vertices = [p1, p2, p3, p4];
      if (lighting[0].avg + lighting[2].avg < lighting[1].avg + lighting[3].avg) {
        lighting.unshift(lighting.pop());
        uvs.unshift(uvs.pop());
        vertices.unshift(vertices.pop());
      }
      let mesh = geometry.opaque;
      if (types[type].hasAlpha) {
        mesh = geometry.alpha;
      } else if (types[type].hasBlending) {
        mesh = geometry.blending;
      } else if (types[type].isGhost) {
        mesh = geometry.ghost;
      }
      lighting.forEach((light) => mesh.color.push(light.r, light.g, light.b));
      uvs.forEach((uv) => mesh.uv.push(...uv));
      vertices.forEach((vertex) => mesh.position.push(...vertex));
      [0, 1, 2, 2, 3, 0].forEach((i) => mesh.index.push(mesh.offset + i));
      mesh.offset += 4;
    };
    const box = (x, y, z, type) => {
      const top = get(x, y + 1, z);
      const bottom = get(x, y - 1, z);
      const south = get(x, y, z + 1);
      const north = get(x, y, z - 1);
      const west = get(x - 1, y, z);
      const east = get(x + 1, y, z);
      if (isVisible(type, top.type)) {
        const n = get(x, y + 1, z - 1);
        const e = get(x + 1, y + 1, z);
        const w = get(x - 1, y + 1, z);
        const s = get(x, y + 1, z + 1);
        pushFace(
          [x, y + 1, z + 1],
          [x + 1, y + 1, z + 1],
          [x + 1, y + 1, z],
          [x, y + 1, z],
          type,
          getLighting(
            top,
            [
              [w, s, get(x - 1, y + 1, z + 1)],
              [e, s, get(x + 1, y + 1, z + 1)],
              [e, n, get(x + 1, y + 1, z - 1)],
              [w, n, get(x - 1, y + 1, z - 1)],
            ]
          ),
          0
        );
      }
      if (isVisible(type, bottom.type)) {
        const n = get(x, y - 1, z - 1);
        const e = get(x + 1, y - 1, z);
        const w = get(x - 1, y - 1, z);
        const s = get(x, y - 1, z + 1);
        pushFace(
          [x, y, z],
          [x + 1, y, z],
          [x + 1, y, z + 1],
          [x, y, z + 1],
          type,
          getLighting(
            bottom,
            [
              [w, n, get(x - 1, y - 1, z - 1)],
              [e, n, get(x + 1, y - 1, z - 1)],
              [e, s, get(x + 1, y - 1, z + 1)],
              [w, s, get(x - 1, y - 1, z + 1)],
            ]
          ),
          1
        );
      }
      if (isVisible(type, south.type)) {
        const e = get(x + 1, y, z + 1);
        const w = get(x - 1, y, z + 1);
        const t = get(x, y + 1, z + 1);
        const b = get(x, y - 1, z + 1);
        pushFace(
          [x, y, z + 1],
          [x + 1, y, z + 1],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
          type,
          getLighting(
            south,
            [
              [w, b, get(x - 1, y - 1, z + 1)],
              [e, b, get(x + 1, y - 1, z + 1)],
              [e, t, get(x + 1, y + 1, z + 1)],
              [w, t, get(x - 1, y + 1, z + 1)],
            ]
          ),
          2
        );
      }
      if (isVisible(type, north.type)) {
        const e = get(x + 1, y, z - 1);
        const w = get(x - 1, y, z - 1);
        const t = get(x, y + 1, z - 1);
        const b = get(x, y - 1, z - 1);
        pushFace(
          [x + 1, y, z],
          [x, y, z],
          [x, y + 1, z],
          [x + 1, y + 1, z],
          type,
          getLighting(
            north,
            [
              [e, b, get(x + 1, y - 1, z - 1)],
              [w, b, get(x - 1, y - 1, z - 1)],
              [w, t, get(x - 1, y + 1, z - 1)],
              [e, t, get(x + 1, y + 1, z - 1)],
            ]
          ),
          3
        );
      }
      if (isVisible(type, west.type)) {
        const n = get(x - 1, y, z - 1);
        const s = get(x - 1, y, z + 1);
        const t = get(x - 1, y + 1, z);
        const b = get(x - 1, y - 1, z);
        pushFace(
          [x, y, z],
          [x, y, z + 1],
          [x, y + 1, z + 1],
          [x, y + 1, z],
          type,
          getLighting(
            west,
            [
              [n, b, get(x - 1, y - 1, z - 1)],
              [s, b, get(x - 1, y - 1, z + 1)],
              [s, t, get(x - 1, y + 1, z + 1)],
              [n, t, get(x - 1, y + 1, z - 1)],
            ]
          ),
          4
        );
      }
      if (isVisible(type, east.type)) {
        const n = get(x + 1, y, z - 1);
        const s = get(x + 1, y, z + 1);
        const t = get(x + 1, y + 1, z);
        const b = get(x + 1, y - 1, z);
        pushFace(
          [x + 1, y, z + 1],
          [x + 1, y, z],
          [x + 1, y + 1, z],
          [x + 1, y + 1, z + 1],
          type,
          getLighting(
            east,
            [
              [s, b, get(x + 1, y - 1, z + 1)],
              [n, b, get(x + 1, y - 1, z - 1)],
              [n, t, get(x + 1, y + 1, z - 1)],
              [s, t, get(x + 1, y + 1, z + 1)],
            ]
          ),
          5
        );
      }
    };
    const cross = (
      x, y, z,
      {
        type,
        light1,
        light2,
        light3,
        sunlight,
      },
      doubleSide
    ) => {
      const lighting = (() => {
        const l1 = light1 / maxLight;
        const l2 = light2 / maxLight;
        const l3 = light3 / maxLight;
        const s = sunlight / maxLight;
        const lighting = getLightColor(l1, l2, l3, s);
        return [...Array(4)].map(() => lighting);
      })();
      pushFace(
        [x, y, z],
        [x + 1, y, z + 1],
        [x + 1, y + 1, z + 1],
        [x, y + 1, z],
        type,
        lighting,
        6
      );
      pushFace(
        [x, y, z + 1],
        [x + 1, y, z],
        [x + 1, y + 1, z],
        [x, y + 1, z + 1],
        type,
        lighting,
        6
      );
      if (doubleSide) {
        pushFace(
          [x + 1, y, z + 1],
          [x, y, z],
          [x, y + 1, z],
          [x + 1, y + 1, z + 1],
          type,
          lighting,
          6
        );
        pushFace(
          [x + 1, y, z],
          [x, y, z + 1],
          [x, y + 1, z + 1],
          [x + 1, y + 1, z],
          type,
          lighting,
          6
        );
      }
    };
    const fromY = subchunk * size;
    const toY = (subchunk + 1) * size;
    for (let x = 0; x < size; x += 1) {
      for (let y = fromY; y < toY; y += 1) {
        for (let z = 0; z < size; z += 1) {
          const voxel = get(x, y, z);
          if (voxel.type !== 0) {
            switch (types[voxel.type].model) {
              case 'cross':
                cross(x, y, z, voxel, !types[voxel.type].hasAlpha);
                break;
              default:
                box(x, y, z, voxel.type);
                break;
            }
          }
        }
      }
    }
    return ['alpha', 'blending', 'ghost', 'opaque'].reduce((meshes, key) => {
      const {
        color,
        position,
        uv,
        index,
      } = geometry[key];
      meshes[key] = {
        color: new Float32Array(color),
        position: new Uint8Array(position),
        uv: new Float32Array(uv),
        index: new Uint16Array(index),
      };
      return meshes;
    }, {});
  });
};

const remesh = (x, z) => {
  const subchunks = mesh(x, z);
  context.postMessage({
    type: 'chunk',
    position: { x, z },
    subchunks,
  }, subchunks.reduce((buffers, meshes) => {
    ['alpha', 'blending', 'ghost', 'opaque'].forEach((mesh) => {
      mesh = meshes[mesh];
      buffers.push(
        mesh.color.buffer,
        mesh.position.buffer,
        mesh.uv.buffer,
        mesh.index.buffer
      );
    });
    return buffers;
  }, []));
};

const remeshDebounced = (() => {
  let debounce;
  const queue = new Map();
  const remeshQueued = () => {
    [...queue.values()].forEach((chunk) => (
      remesh(chunk.x, chunk.z)
    ));
    queue.clear();
  };
  return (x, z) => {
    queue.set(`${x}:${z}`, { x, z });
    if (debounce) {
      clearTimeout(debounce);
    }
    debounce = setTimeout(remeshQueued, 0);
  };
})();

const remeshAll = () => {
  const list = [...meshedChunks.values()];
  if (!list.length) {
    remeshDebounced(0, 0);
    return;
  }
  list.forEach((chunk) => (
    remeshDebounced(chunk.x, chunk.z)
  ));
};

const computeLightmap = ({ offset = { x: 0, y: 0, z: 0 } }) => {
  const getLight = (x, y, z) => {
    const cx = Math.floor(x / size);
    const cz = Math.floor(z / size);
    const key = `${cx}:${cz}`;
    const chunk = meshedChunks.get(key);
    if (!chunk) {
      return false;
    }
    x -= size * chunk.x;
    z -= size * chunk.z;
    const voxel = getIndex(x, y, z);
    const type = types[chunk.voxels[voxel]];
    if (!type.isTranslucent) {
      return false;
    }
    return [
      Math.floor((chunk.voxels[voxel + fields.light1] / maxLight) * 0xFF),
      Math.floor((chunk.voxels[voxel + fields.light2] / maxLight) * 0xFF),
      Math.floor((chunk.voxels[voxel + fields.light3] / maxLight) * 0xFF),
      Math.floor((chunk.voxels[voxel + fields.sunlight] / maxLight) * 0xFF),
    ];
  };

  const { min, max } = [...meshedChunks.values()].reduce(({ min, max }, { x, z, heightmap }) => {
    const height = heightmap.reduce((max, height) => Math.max(max, height), 0);
    return {
      min: {
        x: Math.min(min.x, x * size),
        y: 0,
        z: Math.min(min.z, z * size),
      },
      max: {
        x: Math.max(max.x, (x + 1) * size),
        y: Math.max(max.y, height),
        z: Math.max(max.z, (z + 1) * size),
      },
    };
  }, {
    min: { x: Infinity, y: 0, z: Infinity },
    max: { x: -Infinity, y: 0, z: -Infinity },
  });
  max.y = Math.ceil((max.y + size * 0.5) / size) * size;

  const volume = {
    x: max.x - min.x,
    y: max.y - min.y,
    z: max.z - min.z,
  };

  const lightmap = Array(volume.x * volume.y * volume.z * 4);

  // eslint-disable-next-line prefer-destructuring
  for (let z = min.z, i = 0; z < max.z; z += 1) {
    // eslint-disable-next-line prefer-destructuring
    for (let y = min.y; y < max.y; y += 1) {
      // eslint-disable-next-line prefer-destructuring
      for (let x = min.x; x < max.x; x += 1, i += 4) {
        const light = getLight(x, y, z);
        for (let j = 0; j < 4; j += 1) {
          lightmap[i + j] = String.fromCharCode(light ? light[j] : 0);
        }
      }
    }
  }

  return {
    channels: [
      lightChannels.light1,
      lightChannels.light2,
      lightChannels.light3,
      lightChannels.sunlight,
    ],
    data: btoa(lightmap.join('')),
    origin: {
      x: min.x + offset.x,
      y: min.y + offset.y,
      z: min.z + offset.z,
    },
    size: volume,
  };
};

const computeOcclusion = ({ includeGhost = true, offset = { x: 0, y: 0, z: 0 } }) => {
  const hasOcclusion = (x, y, z) => {
    if (y < 0 || y >= maxHeight) {
      return false;
    }
    const cx = Math.floor(x / size);
    const cz = Math.floor(z / size);
    const key = `${cx}:${cz}`;
    const chunk = meshedChunks.get(key);
    if (!chunk) {
      return false;
    }
    x -= size * chunk.x;
    z -= size * chunk.z;
    const type = chunk.voxels[getIndex(x, y, z)];
    return type !== 0 && (includeGhost || !types[type].isGhost) && !types[type].isTranslucent;
  };

  const { min, max } = [...meshedChunks.values()].reduce(({ min, max }, { x, z, heightmap }) => {
    const height = heightmap.reduce((max, height) => Math.max(max, height), 0);
    return {
      min: {
        x: Math.min(min.x, x * size),
        y: 0,
        z: Math.min(min.z, z * size),
      },
      max: {
        x: Math.max(max.x, (x + 1) * size),
        y: Math.max(max.y, height),
        z: Math.max(max.z, (z + 1) * size),
      },
    };
  }, {
    min: { x: Infinity, y: 0, z: Infinity },
    max: { x: -Infinity, y: 0, z: -Infinity },
  });
  max.y = Math.ceil((max.y + size * 0.5) / size) * size;

  const volume = {
    x: max.x - min.x,
    y: max.y - min.y,
    z: max.z - min.z,
  };

  const occlusionMap = Array(volume.x * volume.y * volume.z);

  // eslint-disable-next-line prefer-destructuring
  for (let z = min.z, i = 0; z < max.z; z += 1) {
    // eslint-disable-next-line prefer-destructuring
    for (let y = min.y; y < max.y; y += 1) {
      // eslint-disable-next-line prefer-destructuring
      for (let x = min.x; x < max.x; x += 1, i += 1) {
        occlusionMap[i] = String.fromCharCode(hasOcclusion(x, y, z) ? 0xFF : 0);
      }
    }
  }

  return {
    data: btoa(occlusionMap.join('')),
    origin: {
      x: min.x + offset.x,
      y: min.y + offset.y,
      z: min.z + offset.z,
    },
    size: volume,
  };
};

const computePhysics = ({ includeGhost = true, offset = { x: 0, y: 0, z: 0 } }) => {
  const hasMass = (x, y, z) => {
    if (y < 0 || y >= maxHeight) {
      return false;
    }
    const cx = Math.floor(x / size);
    const cz = Math.floor(z / size);
    const key = `${cx}:${cz}`;
    const chunk = meshedChunks.get(key);
    if (!chunk) {
      return false;
    }
    x -= size * chunk.x;
    z -= size * chunk.z;
    const type = chunk.voxels[getIndex(x, y, z)];
    return type !== 0 && (includeGhost || !types[type].isGhost) && types[type].model !== 'cross';
  };

  const { min, max } = [...meshedChunks.values()].reduce(({ min, max }, { x, z }) => ({
    min: { x: Math.min(min.x, x * size), z: Math.min(min.z, z * size) },
    max: { x: Math.max(max.x, (x + 1) * size), z: Math.max(max.z, (z + 1) * size) },
  }), { min: { x: Infinity, z: Infinity }, max: { x: -Infinity, z: -Infinity } });

  const boxes = [];
  const map = new Map();

  // eslint-disable-next-line prefer-destructuring
  for (let x = min.x; x < max.x; x += 1) {
    for (let y = 0; y < maxHeight; y += 1) {
      // eslint-disable-next-line prefer-destructuring
      for (let z = min.z; z < max.z; z += 1) {
        if (hasMass(x, y, z) && !map.has(`${x}:${y}:${z}`)) {
          const box = {
            position: { x, y, z },
            size: { x: 0, y: 0, z: 0 },
          };
          boxes.push(box);

          for (let i = x + 1; i <= max.x; i += 1) {
            if (!hasMass(i, y, z) || map.has(`${i}:${y}:${z}`)) {
              box.size.x = i - x;
              break;
            }
          }

          box.size.y = maxHeight - y;
          for (let i = x; i < x + box.size.x; i += 1) {
            for (let j = y + 1; j <= y + box.size.y; j += 1) {
              if (!hasMass(i, j, z) || map.has(`${i}:${j}:${z}`)) {
                box.size.y = j - y;
              }
            }
          }

          box.size.z = max.z - z;
          for (let i = x; i < x + box.size.x; i += 1) {
            for (let j = y; j < y + box.size.y; j += 1) {
              for (let k = z + 1; k <= z + box.size.z; k += 1) {
                if (!hasMass(i, j, k) || map.has(`${i}:${j}:${k}`)) {
                  box.size.z = k - z;
                }
              }
            }
          }

          for (let i = x; i < x + box.size.x; i += 1) {
            for (let j = y; j < y + box.size.y; j += 1) {
              for (let k = z; k < z + box.size.z; k += 1) {
                map.set(`${i}:${j}:${k}`, true);
              }
            }
          }
        }
      }
    }
  }

  return boxes.map(({ position, size }) => [
    [position.x + offset.x, position.y + offset.y, position.z + offset.z],
    [size.x, size.y, size.z],
  ]);
};

context.addEventListener('message', ({ data: message }) => {
  switch (message.type) {
    case 'types': {
      const previousTypes = types;
      const textures = { alpha: 0, blending: 0, opaque: 0 };
      types = [
        {
          name: 'Air',
          isTranslucent: true,
        },
        ...message.types
          .map((type) => {
            let material = 'opaque';
            if (type.hasAlpha) {
              material = 'alpha';
            } else if (type.hasBlending) {
              material = 'blending';
            }
            const isCross = type.model === 'cross';
            const index = textures[material];
            if (!type.isGhost) {
              textures[material] += isCross ? 1 : 3;
            }
            return {
              ...type,
              hasAO: !isCross,
              isCulled: !isCross,
              isTranslucent: isCross || type.hasAlpha || type.hasBlending,
              textures: isCross ? [index] : [
                index,
                index + 2,
                index + 1,
                index + 1,
                index + 1,
                index + 1,
              ],
            };
          })
          .map((type) => ({
            ...type,
            textures: type.textures.map((index) => {
              let material = 'opaque';
              if (type.hasAlpha) {
                material = 'alpha';
              } else if (type.hasBlending) {
                material = 'blending';
              }
              const slotSize = 1 / Math.max(textures[material], 9);
              const slotPixel = slotSize / (textureWidth + 2);
              const from = (index * slotSize) + slotPixel;
              return {
                from,
                to: from + (slotPixel * textureWidth),
              };
            }),
          })),
        {
          name: 'Bedrock',
          hasAO: true,
          isCulled: true,
          isTranslucent: false,
        },
      ];
      edges.bottom.type = types.length - 1;
      if (previousTypes) {
        let repropagate = false;
        let remap = false;
        if (types.length < previousTypes.length) {
          repropagate = true;
          remap = previousTypes.map(({ key }) => {
            if (!key) {
              return 0;
            }
            const index = types.findIndex(({ key: id }) => (id === key));
            return ~index ? index : 0;
          });
        } else {
          const len = previousTypes.length;
          for (let i = 0; i < len; i += 1) {
            const prev = previousTypes[i];
            const current = types[i];
            if (
              prev.model !== current.model
              || prev.hasAlpha !== current.hasAlpha
              || prev.hasBlending !== current.hasBlending
              || prev.isGhost !== current.isGhost
              || prev.light !== current.light
            ) {
              repropagate = true;
              break;
            }
          }
        }
        if (repropagate) {
          [...chunks.values()].forEach(({ key }) => {
            if (!meshedChunks.has(key)) {
              chunks.delete(key);
            }
          });
          [...meshedChunks.values()].forEach((chunk) => {
            const { voxels } = chunk;
            const { length } = voxels;
            for (let i = 0; i < length; i += fields.count) {
              if (remap) {
                voxels[i] = remap[voxels[i]];
              }
              const { light } = types[voxels[i]];
              voxels[i + fields.light1] = light === 1 ? maxLight : 0;
              voxels[i + fields.light2] = light === 2 ? maxLight : 0;
              voxels[i + fields.light3] = light === 3 ? maxLight : 0;
              voxels[i + fields.sunlight] = 0;
            }
            chunk.hasPropagated = false;
          });
        }
      }
      remeshAll();
      break;
    }
    case 'lighting':
      lightChannels.light1 = message.channels.channel1;
      lightChannels.light2 = message.channels.channel2;
      lightChannels.light3 = message.channels.channel3;
      lightChannels.sunlight = message.channels.sunlight;
      remeshAll();
      break;
    case 'clone':
      if (
        message.from.y >= 0 && message.from.y < maxHeight
        && message.to.y >= 0 && message.to.y < maxHeight
      ) {
        const chunk = clone(message.from, message.to);
        [
          chunk,
          ...chunkNeighbors.map(({ x, z }) => ({
            x: chunk.x + x,
            z: chunk.z + z,
          })),
        ].forEach((chunk) => (
          remeshDebounced(chunk.x, chunk.z)
        ));
      }
      break;
    case 'update':
      if (message.update.y >= 0 && message.update.y < maxHeight) {
        const chunk = update(message.update);
        [
          chunk,
          ...chunkNeighbors.map(({ x, z }) => ({
            x: chunk.x + x,
            z: chunk.z + z,
          })),
        ].forEach((chunk) => (
          remeshDebounced(chunk.x, chunk.z)
        ));
      }
      break;
    case 'pick': {
      const { block } = message;
      if (block.y >= 0 && block.y < maxHeight) {
        const chunk = getChunk(
          Math.floor(block.x / size),
          Math.floor(block.z / size)
        );
        block.x -= size * chunk.x;
        block.z -= size * chunk.z;
        context.postMessage({
          type: 'pick',
          block: chunk.voxels[getIndex(block.x, block.y, block.z)],
        });
      }
      break;
    }
    case 'load':
      chunks.clear();
      meshedChunks.clear();
      types = undefined;
      message.chunks.forEach(({ x, z, voxels: serialized }) => {
        const key = `${x}:${z}`;
        const deserialized = new Uint8ClampedArray(atob(serialized).split('').map((c) => c.charCodeAt(0)));
        const voxels = new Uint8ClampedArray(size * size * maxHeight * fields.count);
        const heightmap = new Uint8ClampedArray(size ** 2);
        for (let x = 0, i = 0, j = 0; x < size; x += 1) {
          for (let y = 0; y < maxHeight; y += 1) {
            for (let z = 0; z < size; z += 1, i += fields.count, j += 1) {
              const type = deserialized[j];
              voxels[i] = type;
              if (type !== 0) {
                const heightmapIndex = (x * size) + z;
                if (heightmap[heightmapIndex] < y) {
                  heightmap[heightmapIndex] = y;
                }
                const { light } = message.types[type - 1];
                if (light) {
                  voxels[i + fields[`light${light}`]] = maxLight;
                }
              }
            }
          }
        }
        const chunk = {
          x,
          z,
          voxels,
          heightmap,
          hasPropagated: false,
          key,
        };
        chunks.set(key, chunk);
        meshedChunks.set(key, chunk);
      });
      break;
    case 'save':
      context.postMessage({
        type: 'save',
        chunks: [...meshedChunks.values()].map(({ x, z, voxels }) => {
          const data = new Uint8ClampedArray(size * size * maxHeight);
          const { length } = voxels;
          for (let i = 0, j = 0; i < length; i += 1, j += fields.count) {
            data[i] = voxels[j];
          }
          return {
            x,
            z,
            voxels: btoa(String.fromCharCode.apply(null, data)),
          };
        }),
      });
      break;
    case 'computeLightmap':
      context.postMessage({
        type: 'lightmap',
        lightmap: computeLightmap(message),
      });
      break;
    case 'computeOcclusion':
      context.postMessage({
        type: 'occlusion',
        occlusion: computeOcclusion(message),
      });
      break;
    case 'computePhysics':
      context.postMessage({
        type: 'physics',
        boxes: computePhysics(message),
      });
      break;
    case 'reset':
      chunks.clear();
      meshedChunks.clear();
      break;
    default:
      break;
  }
});
