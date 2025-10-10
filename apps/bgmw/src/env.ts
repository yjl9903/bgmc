/// <reference types="@cloudflare/workers-types" />

export type ServiceBindings = {
  BANGUMI_DB: D1Database;
  TMDB_DB: D1Database;
  REVISIONS_DB: D1Database;
  LOGS: KVNamespace;
};

export type AppVariables = {
  requestId: string;
  executionContext?: ExecutionContext;
};

export type AppEnv = {
  Bindings: ServiceBindings;
  Variables: AppVariables;
};
