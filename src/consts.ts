import type { Terminal } from 'terminal-kit';

export const CONST = {
  ci: false,
  terminalWidth: 90 as const,
  VERBOSE: true,
 
 
};


export type ConstTypes = typeof CONST;

export const tables: { [template: string]: Terminal.TextTableOptions } = {
  error: {
    hasBorder: true,
    contentHasMarkup: true,
    fit: true,

    firstCellTextAttr: { bgColor: 'red' },
    borderAttr: { color: 'white' },
    borderChars: 'lightRounded',
    textAttr: { bgColor: 'default' },
    firstRowTextAttr: { bgColor: 'red' },
    width: CONST.terminalWidth,
  },
  outputDisplay: {
    hasBorder: true,
    contentHasMarkup: 'ansi',
    fit: true,

    borderAttr: { color: 'lime' },
    borderChars: 'lightRounded',
    firstCellTextAttr: { bgColor: 'default' },
    firstRowTextAttr: { bgColor: 'blue' },

    textAttr: { bgColor: 'default' },
    width: CONST.terminalWidth,
  },
  cropDisplay: {
    hasBorder: true,
    contentHasMarkup: 'ansi',
    fit: true,
    wordWrap: false,

    borderAttr: { color: 'green' },
    borderChars: 'lightRounded',
    firstCellTextAttr: { bgColor: 'default' },
    firstRowTextAttr: { bgColor: 'blue' },

    textAttr: { bgColor: 'default' },
    width: CONST.terminalWidth,
  },
} as const;

export type ValueOf<T> = T[keyof T];
export type ValueIn<T> = T extends Readonly<Array<infer U>> ? U : never;
