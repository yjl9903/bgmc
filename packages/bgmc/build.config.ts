import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index', 'src/data', { input: 'src/types/index', name: 'types' }, 'src/cli'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true
  }
});
