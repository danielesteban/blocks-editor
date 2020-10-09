import { writable } from 'svelte/store';

export default () => writable([
  'const size = 16;',
  'const offset = { x: -8, z: -0 };',
  '',
  '// comment out this line for incremental updates',
  'reset();',
  '',
  '// box helper',
  'box(',
  '  offset.x, 0, offset.z, // position',
  '  size, 1, size,         // size',
  '  1                      // block type',
  ');',
  '',
  '// sphere helper',
  'sphere(',
  '  offset.x + size - 1, size, offset.z - size, // position',
  '  size * 0.5,                                 // radius',
  '  1                                           // block type',
  ');',
  '',
  '// brittle mountain',
  'const center = (size * 0.5) - 0.5;',
  'for (let x = 0; x < size; x += 1) {',
  '  for (let y = 1; y < size; y += 1) {',
  '    for (let z = 0; z < size; z += 1) {',
  '      const cx = x - center;',
  '      const cz = z - center;',
  '      const height = Math.max(Math.min(',
  '        size * Math.exp(-(cx*cx + cz*cz) / (size * 1.5)),',
  '        size * noise.noise3d(cx / 3, y / 3, cz / 3)',
  '      ), 1);',
  '      if (y < height) {',
  '        // update helper',
  '        update(',
  '          offset.x + x, y, offset.z + z, // position',
  '          1                              // block type',
  '        );',
  '      }',
  '    }',
  '  }',
  '}',
  '',
  '// carve out a tunnel',
  'box(',
  '  offset.x + size * 0.5 - 2, 1, offset.z,',
  '  4, 5, size,',
  '  0',
  ');',
  '',
  '// mirror everything to the side',
  'for (let x = 0; x < size; x += 1) {',
  '  for (let y = 0; y < size; y += 1) {',
  '    for (let z = 0; z < size; z += 1) {',
  '      // clone helper',
  '      clone(',
  '       offset.x + x, y, offset.z + z,            // from',
  '       -offset.x + size - 1 - x, y, offset.z + z // to',
  '      );',
  '    }',
  '  }',
  '}',
].join('\n'));
