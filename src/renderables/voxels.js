import {
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  Group,
  Mesh,
  BufferAttribute,
  MeshBasicMaterial,
  NearestFilter,
  RGBFormat,
  RGBAFormat,
  RepeatWrapping,
  sRGBEncoding,
  UnsignedByteType,
  UVMapping,
  Vector3,
} from 'three';

// Voxels chunk

class Voxels extends Group {
  static setupMaterials() {
    Voxels.materials = {
      ghost: new MeshBasicMaterial({
        vertexColors: true,
        wireframe: true,
      }),
      opaque: new MeshBasicMaterial({
        vertexColors: true,
      }),
      transparent: new MeshBasicMaterial({
        transparent: true,
        vertexColors: true,
      }),
    };
  }

  static getExportableMaterials() {
    if (!Voxels.materials) {
      Voxels.setupMaterials();
    }
    const { materials } = Voxels;
    return ['opaque', 'transparent'].reduce((exported, key) => {
      if (materials[key].map) {
        const { map: texture } = materials[key];
        const { image } = texture;
        const material = materials[key].clone();
        const data = new ImageData(image.width, image.height);
        const isTransparent = texture.format === RGBAFormat;
        const stride = isTransparent ? 4 : 3;
        const { length } = data.data;
        for (let i = 0, j = 0; i < length; i += 4, j += stride) {
          data.data[i] = image.data[j];
          data.data[i + 1] = image.data[j + 1];
          data.data[i + 2] = image.data[j + 2];
          data.data[i + 3] = isTransparent ? image.data[j + 3] : 0xFF;
        }
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').putImageData(data, 0, 0);
        material.map = new CanvasTexture(
          canvas,
          UVMapping,
          RepeatWrapping,
          RepeatWrapping,
          NearestFilter,
          NearestFilter,
          RGBAFormat,
          UnsignedByteType,
          1,
          sRGBEncoding
        );
        material.map.flipY = false;
        material.name = key;
        exported[key] = material;
      }
      return exported;
    }, {});
  }

  static updateAtlas(atlas) {
    if (!Voxels.materials) {
      Voxels.setupMaterials();
    }
    const { materials } = Voxels;
    ['opaque', 'transparent'].forEach((key) => {
      if (materials[key].map) {
        materials[key].map.dispose();
        materials[key].map = null;
      }
      const { pixels, width, height } = atlas[key];
      if (!pixels.length) {
        return;
      }
      const texture = new DataTexture(
        pixels,
        width,
        height,
        key === 'transparent' ? RGBAFormat : RGBFormat,
        UnsignedByteType,
        UVMapping,
        RepeatWrapping,
        RepeatWrapping,
        NearestFilter,
        NearestFilter,
        1,
        sRGBEncoding
      );
      texture.needsUpdate = true;
      materials[key].map = texture;
    });
  }

  constructor(subchunk) {
    if (!Voxels.materials) {
      Voxels.setupMaterials();
    }
    super();
    this.matrixAutoUpdate = false;
    this.meshes = {
      ghost: new Mesh(new BufferGeometry(), Voxels.materials.ghost),
      opaque: new Mesh(new BufferGeometry(), Voxels.materials.opaque),
      transparent: new Mesh(new BufferGeometry(), Voxels.materials.transparent),
    };
    ['ghost', 'opaque', 'transparent'].forEach((key) => {
      this.meshes[key].matrixAutoUpdate = false;
      this.add(this.meshes[key]);
    });
    this.subchunk = subchunk;
    this.position.set(subchunk.x * 16, 0, subchunk.z * 16);
    this.updateMatrix();
  }

  clone(materials, offset = new Vector3(0, 0, 0)) {
    const { meshes, position, scale } = this;
    const clone = new Group();
    clone.position.copy(position).add(offset);
    clone.scale.copy(scale);
    ['opaque', 'transparent'].forEach((key) => {
      const mesh = meshes[key];
      if (mesh.visible) {
        const cloned = mesh.clone();
        cloned.material = materials[key];
        clone.add(cloned);
      }
    });
    return clone;
  }

  dispose() {
    const { geometry } = this;
    geometry.dispose();
  }

  update(geometries) {
    const { meshes } = this;
    ['ghost', 'opaque', 'transparent'].forEach((key) => {
      const {
        color,
        position,
        uv,
        index,
      } = geometries[key];
      const mesh = meshes[key];

      if (!position.length) {
        mesh.visible = false;
        return;
      }

      const { geometry } = mesh;
      geometry.setAttribute('color', new BufferAttribute(color, 3));
      geometry.setAttribute('position', new BufferAttribute(position, 3));
      geometry.setAttribute('uv', new BufferAttribute(uv, 2));
      geometry.setIndex(new BufferAttribute(index, 1));
      geometry.computeBoundingSphere();
      mesh.visible = true;
    });
  }
}

export default Voxels;
