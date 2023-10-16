import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/transform', 'src/types'],
  clean: false,
  declaration: true,
  rollup: {
    emitCJS: true
  },
  externals: ['bangumi-data']
});
