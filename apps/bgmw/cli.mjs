#!/usr/bin/env node

import { serve } from '@hono/node-server';

import { createApp } from './dist/index.js';

const app = createApp();

serve(app);
