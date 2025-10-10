import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    types: 'src/types/index.ts',
    cli: 'src/cli.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist'
});
