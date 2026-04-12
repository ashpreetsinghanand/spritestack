#!/usr/bin/env node

import { program } from './cli';

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
