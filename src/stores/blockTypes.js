import { get, writable } from 'svelte/store';

const textureWidth = 16;
const textureHeight = 16;

const defaultTexture = () => {
  const pixels = new Uint8ClampedArray(textureWidth * textureHeight * 4);
  for (let y = 0; y < textureHeight; y += 1) {
    for (let x = 0; x < textureWidth; x += 1) {
      let light = 0.9 + Math.random() * 0.05;
      if (
        x === 0
        || x === textureWidth - 1
        || y === 0
        || y === textureWidth - 1
      ) {
        light *= 0.9;
      } else if (
        x === 1
        || x === textureWidth - 2
        || y === 1
        || y === textureWidth - 2
      ) {
        light *= 1.2;
      }
      light = Math.floor(Math.min(Math.max(light, 0), 1) * 0xFF);
      const i = (y * textureWidth + x) * 4;
      pixels[i] = light;
      pixels[i + 1] = light;
      pixels[i + 2] = light;
      pixels[i + 3] = 0xFF;
    }
  }
  return pixels;
};

const generateDefaultTextures = () => ({
  bottom: defaultTexture(),
  side: defaultTexture(),
  top: defaultTexture(),
});

const defaultTypes = [
  {
    name: 'Default block',
  },
];

export default () => {
  let createTextures;
  let cloneTextures;
  let removeTextures;
  let deserializeTextures;
  let resetTextures;
  let updateAtlas;
  const textures = (() => {
    const { subscribe, set, update } = writable([]);
    createTextures = () => {
      update((types) => [...types, generateDefaultTextures()]);
      updateAtlas();
    };
    cloneTextures = (type) => {
      update((types) => [...types,
        ['bottom', 'side', 'top'].reduce((textures, key) => {
          textures[key] = new Uint8ClampedArray(types[type][key]);
          return textures;
        }, {}),
      ]);
      updateAtlas();
    };
    removeTextures = (type) => {
      update((types) => [...types.slice(0, type), ...types.slice(type + 1)]);
      updateAtlas();
    };
    deserializeTextures = (serialized) => {
      set(serialized.map((serialized) => ['bottom', 'side', 'top'].reduce((textures, key) => {
        textures[key] = new Uint8ClampedArray(atob(serialized[key]).split('').map((c) => c.charCodeAt(0)));
        return textures;
      }, {})));
      updateAtlas();
    };
    resetTextures = () => {
      set([]);
    };
    return {
      subscribe,
      update(type, texture, pixels) {
        update((types) => [
          ...types.slice(0, type),
          {
            ...types[type],
            [texture]: pixels,
          },
          ...types.slice(type + 1),
        ]);
        updateAtlas();
      },
    };
  })();
  const types = (() => {
    const { subscribe, set, update } = writable([]);
    let key = 1;
    return {
      subscribe,
      create(type = {}) {
        update((types) => [...types, {
          name: type.name || 'New Block',
          model: type.model || 'box',
          isLight: type.isLight || false,
          isTransparent: type.isTransparent || false,
          key,
        }]);
        key += 1;
        createTextures();
      },
      clone(type) {
        update((types) => [...types, {
          ...types[type],
          name: `${types[type].name} (Copy)`,
          key,
        }]);
        key += 1;
        cloneTextures(type);
      },
      remove(type) {
        update((types) => [...types.slice(0, type), ...types.slice(type + 1)]);
        removeTextures(type);
      },
      update(type, key, value) {
        update((types) => [
          ...types.slice(0, type),
          {
            ...types[type],
            [key]: value,
          },
          ...types.slice(type + 1),
        ]);
        if (key === 'isTransparent') {
          updateAtlas();
        }
      },
      deserialize(types) {
        key = 1;
        const serializedTextures = [];
        set(types.map(({ textures, ...type }, i) => {
          type.key = key;
          key += 1;
          serializedTextures[i] = textures;
          return type;
        }));
        deserializeTextures(serializedTextures);
      },
      serialize() {
        const $textures = get(textures);
        const $types = get(types);
        return $types.map(({ key: id, ...type }, i) => ({
          ...type,
          textures: ['bottom', 'side', 'top'].reduce((textures, key) => {
            textures[key] = btoa(String.fromCharCode.apply(null, $textures[i][key]));
            return textures;
          }, {}),
        }));
      },
      reset() {
        key = 1;
        set([]);
        resetTextures();
        defaultTypes.forEach((type) => (
          types.create(type)
        ));
      },
    };
  })();
  const atlas = (() => {
    const { subscribe, set } = writable();
    updateAtlas = () => {
      const $textures = get(textures);
      const $types = get(types);
      const materials = $types.reduce((materials, { isTransparent }, i) => {
        const { bottom, side, top } = $textures[i];
        const type = materials[isTransparent ? 'transparent' : 'opaque'];
        type.push(
          bottom,
          side,
          top
        );
        return materials;
      }, { opaque: [], transparent: [] });
      set(['opaque', 'transparent'].reduce((atlas, key) => {
        const slotWidth = textureWidth + 2;
        const isTransparent = key === 'transparent';
        const width = materials[key].length * slotWidth;
        const height = textureHeight + 2;
        const strideX = isTransparent ? 4 : 3;
        const strideY = width * strideX;
        const pixels = new Uint8ClampedArray(strideY * height);
        materials[key].forEach((texture, i) => {
          const offset = i * slotWidth;
          for (let y = 0, j = 0; y < height; y += 1) {
            for (let x = 0; x < slotWidth; x += 1) {
              if (x === 0 && (y === 1 || y === height - 1)) {
                j -= textureWidth * 4;
              }
              const p = (y * strideY) + ((offset + x) * strideX);
              pixels[p] = texture[j];
              pixels[p + 1] = texture[j + 1];
              pixels[p + 2] = texture[j + 2];
              if (isTransparent) {
                pixels[p + 3] = texture[j + 3];
              }
              if (x !== 0 && x !== slotWidth - 2) {
                j += 4;
              }
            }
          }
        });
        atlas[key] = {
          pixels,
          width,
          height,
        };
        return atlas;
      }, {}));
    };
    return {
      subscribe,
    };
  })();
  types.reset();
  const lighting = writable({
    sunlight: 0.5,
  });
  return {
    atlas,
    lighting,
    types,
    textures,
  };
};
