import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/transform', 'src/types'],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true
  },
  externals: ['bangumi-data', 'bgmc']
});
