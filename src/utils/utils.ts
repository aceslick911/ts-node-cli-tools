import path from 'path';
import terminal from 'terminal-kit';

import { text } from './text.js';
import { logger } from './logger.js';

import os from 'os';

/** Common utilities */
export const resolveHomePath = os.homedir();

export const getRelativePath = (file: string) => {
  const resolved = path.resolve('../', file);

  return resolved;
};

export const getRegexMatches = (reg: RegExp, data: string) => {
  let match;
  const matches:RegExpExecArray[] = [];
  if (!reg.global) {
    throw new Error(
      `Regex ${reg.source} must be global or will loop infinitely`,
    );
  }
  while ((match = reg.exec(data) as RegExpExecArray) !== null) {
    match.splice(0, 1);

    matches.push(match);
  }

  return matches; // removes match metadata
};

export const renderRegexMatches = (reg: RegExp, data: string) => {
  let match;
  const output:string[] = [];
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

export const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));
