import { createApp } from './app';

export { createApp };

export type { AppEnv, AppVariables, ServiceBindings } from './env';

const app = createApp();

export default app;
