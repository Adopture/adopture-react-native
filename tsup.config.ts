import { defineConfig } from 'tsup';

import pkg from './package.json';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    define: {
      __SDK_VERSION__: JSON.stringify(pkg.version),
    },
    external: [
      'react',
      'react-native',
      '@react-native-async-storage/async-storage',
      '@react-native-community/netinfo',
      '@react-navigation/native',
    ],
  },
]);
