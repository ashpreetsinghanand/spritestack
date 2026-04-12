#!/usr/bin/env node

import { program } from './cli';

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
