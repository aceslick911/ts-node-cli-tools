import path from 'path';
import terminal from 'terminal-kit';

import { text } from './text.js';
import { logger } from './logger.js';

/** Common utilities */

export const getRelativePath = (file: string) => {
  const resolved = path.resolve('../', file);

  return resolved;
};

export const renderRegexMatches = (reg: RegExp, data: string) => {
  let match;
  const output = [];
  while ((match = reg.exec(data)) !== null) {
    output.push(
      `  [${text.strong(match.index)}-${text.strong(
        match.index + terminal.stringWidth(match[0]),
      )}]: ${text.italic(match[0])}`,
    );
    logger.log(output[output.length - 1]);
  }
  return output.join('\n');
};
