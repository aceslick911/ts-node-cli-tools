#!/usr/bin/env node

import { CONST } from './consts.js';
import { program } from 'bandersnatch';
import { logger } from './utils/logger.js';
import { text } from './utils/text.js';

// Ensure this is not run from the wrong directory
if (process.env.INIT_CWD.endsWith('scripts')) {
  logger.error(
    `Please run this script from the root directory. CWD is: ${process.env.INIT_CWD}`,
  );
  process.exit(1);
}

// Bandersnatch managed CLI
// https://github.com/hongaar/bandersnatch
const app = program({
  help: true,
});

const run = async () => {
  app.description(await text.title('TS-CLI'));

  // Add  commands here:

  // Start command workflows
  await app.run();
};

// Main method run by cli.js
export const runScripts = () =>
  run().catch(e => {
    // When no parameters provided, show help
    app.run('help');

    logger.tableError(
      e.name,
      e.message,
      CONST.VERBOSE &&
        `${e.stack || ''}
`,
    );

    process.exit(1);
  });
