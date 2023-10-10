import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/transform'],
  clean: false,
  declaration: true,
  rollup: {
    emitCJS: true
  },
  externals: ['bangumi-data']
});
