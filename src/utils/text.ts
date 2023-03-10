import figlet from 'figlet';
import terminal from 'terminal-kit';
const term = terminal.terminal;

import { CONST } from '../consts.js';

/** Text formatting utilities */
export const text = {
  title: async (text: string, font?: figlet.Fonts) =>
    await new Promise<string>(resolve => {
      return figlet.text(
        text,
        { font: font || 'Big Money-se' },
        (err, formatted) => {
          resolve(formatted as string);
        },
      );
    }),

  strong: (text: string) => term.str.bold(text) as unknown as string,
  dim: (text: string) => term.str.dim(text) as unknown as string,
  italic: (text: string) =>
    CONST.ci ? text : (term.str.italic(text) as unknown as string),

  green: (text: string) => term.str.green(text) as unknown as string,
  red: (text: string) => term.str.red(text) as unknown as string,
  blue: (text: string) => term.str.cyan(text) as unknown as string,
  underline: (text: string) => term.str.underline(text) as unknown as string,

  trimLeftMultiline: (data: string, padding = 2) => {
    const output = data
      .split('\n')
      .map(line => line.substring(0, CONST.terminalWidth - padding))
      .join('');

    return output;
  },
  trimRightMultiline: (data: string, padding = 2) => {
    const longest = data
      .split('\n')
      .map(line => line.length)
      .reduce((a, b) => Math.max(a, b));

    const paddedText = data
      .split('\n')
      .map(line => line.padEnd(longest, ' '))
      .join('\n');

    const output = paddedText
      .split('\n')
      .map(line => line.substring(CONST.terminalWidth - longest - padding))
      .join('');

    return output;
  },

  width: (text: string) => terminal.stringWidth(text),

  alignCenter: (text: string, padding?: number, spaceOnly?: boolean) =>
    new Array(
      Math.round(
        CONST.terminalWidth / 2 -
          terminal.stringWidth(text) / 2 -
          (padding || 0),
      ),
    ).join(' ') + (spaceOnly ? '' : text),
};
