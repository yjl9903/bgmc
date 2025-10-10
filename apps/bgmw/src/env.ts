/// <reference types="@cloudflare/workers-types" />

import type { Database } from './database';

export type ServiceBindings = {
  DATABASE: D1Database;
};

export type AppVariables = {
  requestId: string;
  database: Database;
};

export type AppEnv = {
  Bindings: ServiceBindings;
  Variables: AppVariables;
};
