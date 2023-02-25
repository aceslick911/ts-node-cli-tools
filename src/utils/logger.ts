import { CONST, tables } from '../consts.js';
import { text } from './text.js';

import terminal from 'terminal-kit';
const term = terminal.terminal;

export const safeStringify = (obj) => {
  if (!obj) return '';
  try {
    if (Array.isArray(obj)) {
      return obj.map(item => JSON.stringify(item)).join(', ');
    }

    return JSON.stringify(obj, null, 2);
  } catch (e) {
    logger.error('Error stringifying object', obj, e);
    return obj;
  }
};

/** Output Logging utilities */
export const logger = {
  stack: [] as string[],
  indentString: (noBar?: boolean) =>
    (logger.stack.length > 1 ? ' '.repeat(logger.stack.length - 1) : '') +
    (noBar === true
      ? logger.stack.length > 1
        ? '1'
        : ''
      : term.str.dim(logger.stack.length === 0 ? '│ ' : '│ ')),
  increaseIndent: (indentName?: string) => {
    if (indentName) {
      logger.indentLine('╭');

      term(
        logger.indentString(true) +
          term.str.dim('│') +
          indentName +
          //term.str.bold(indentName) +
          '\n',
      );
      logger.indentLine('├');
    }
    logger.stack.push(indentName);
  },
  indentLine: (prefix?: string) => {
    term(
      logger.indentString(true) +
        term.str.dim(
          (prefix || '╰') +
            '─'.repeat(CONST.terminalWidth - logger.stack.length - 1),
        ) +
        '\n',
    );
  },
  decreaseIndent: (closer?: string) => {
    logger.stack.pop();
    if (closer) {
      logger.log(closer);
    }
    logger.indentLine();
  },

  indented: <T>(name: string, fn: () => Promise<T>) => {
    logger.increaseIndent(name);
    return new Promise<T>((resolve, reject) => {
      return (typeof fn === 'function' ? fn() : fn)
        .then(val => {
          logger.decreaseIndent();
          resolve(val);
        })
        .catch(err => {
          logger.decreaseIndent();
          reject(err);
        });
    });
  },

  // /** No new line */
  // // print: (text: string, ...args) => {
  // //   term(`${logger.indentString()}${text + safeStringify(args)}`);
  // // },

  /** With New line */
  log: (text: string, ...args) => {
    const lines = `${text + safeStringify(args)}`
      .split(/\n|\r/)
      .filter(val => val !== '' && val !== ' ');
    lines.forEach(line => term(`${logger.indentString()}${line}\n`));
    // term(`${logger.indentString()}\n`)
  },

  error: (text: string, ...args) =>
    term(
      logger.indentString() +
        term.str.red('\n' + text + safeStringify(args) + '\n'),
    ),
  errorStack: (error: string) => {
    logger.error('Error at ' + logger.stack.join('.'));
    logger.error(error);
  },
  success: (text: string) => term.green(logger.indentString() + text),
  info: (text: string) => term.blue(logger.indentString() + text),
  warn: (text: string) => {
    const lines = text.split(/\n|\r/).filter(val => val !== '' && val !== ' ');

    lines.forEach(line =>
      term(
        logger.indentString() +
          term.str.yellow(`${line.trimStart().trimEnd()}\n`),
      ),
    );
  },
  debug: (text: string) => term.magenta(logger.indentString() + text),
  trace: (text: string) => term.cyan(logger.indentString() + text),

  tableError: (name: string, error: string, stack?: string | false) => {
    CONST.ci
      ? `${name} - ${error} - ${stack}`
      : term.table(
          (stack && [[name], [error], [stack]]) || [[name], [error]],
          tables.error,
        );
  },

  variableTable: (
    name: string,
    variables: {
      option: string;
      value: string;
      description: string;
    }[],
  ) => {
    // CLI Parameters
    logger.log(`
${text.strong('CLI Command:')}
yarn cli ${name} \\
${variables.map(variable => `--${variable.option}=${variable.value}`).join(` \\
`)}
`);

    //Table
    CONST.ci
      ? `${name}`
      : term.table(
          [
            [`Command: ${text.strong(name)}`, 'Value'],
            ...variables.map(
              variable =>
                [
                  text.strong(variable.option),
                  text.strong(variable.value),
                ] as string[],
            ),
          ],
          tables.outputDisplay,
        );
  },

  npxTable: async (sourceDirectory: string, rootFolder: string) => {
    const url = `${text.underline(
      text.blue(`http://localhost:3000${rootFolder}`),
    )} (${sourceDirectory})`;

    return term.table(
      [
        [await text.title(`NPX Serve`)],
        [text.trimLeftMultiline(await text.title(rootFolder))],
        [
          `🧪 npx serve active on:\n${
            text.alignCenter(url, 2, true) + url
          }\n\n${text.alignCenter(`🔘 Press ctrl+c to stop`, 2)}
      `,
        ],
      ],
      tables.cropDisplay,
    );
  },
};

export const drawImage = (path: string) => {
  term.drawImage(path, {
    shrink: {
      width: CONST.terminalWidth,
      height: 50,
    },
  });
};

const useProgress = false;

const fakeProgressBar = {
  update: () => {},
  stop: () => {},
  startItem: () => {},
  itemDone: () => {},
};

export const progressBar = (props: {
  title: string;
  items: number;
  width?: number;
  eta?: boolean;
  percent?: boolean;
}) => {
  const progressBar = useProgress
    ? term.progressBar({
        inline: false,
        width: CONST.terminalWidth,
        titleSize: 30,
        title: props.title,
        eta: props.eta || true,
        percent: props.percent || true,
        items: props.items,
        itemStyle: term.italic,
        barStyle: term.brightGreen.bold,
        barBracketStyle: term.brightWhite,
        percentStyle: term.brightMagenta.inverse,
        barChar: '~',
        barHeadChar: '*',
      })
    : fakeProgressBar;

  return progressBar;
};
