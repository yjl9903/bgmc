import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    transform: 'src/transform.ts',
    types: 'src/types.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  external: ['bangumi-data', 'bgmc']
});
