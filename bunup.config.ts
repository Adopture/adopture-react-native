import { defineConfig } from 'bunup';

export default defineConfig({
  entry: ['src/index.ts', 'src/react/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: 'linked',
  external: [
    'react',
    'react-native',
    '@react-native-async-storage/async-storage',
    '@react-native-community/netinfo',
    '@react-navigation/native',
    'expo-localization',
    'expo-constants',
  ],
});
