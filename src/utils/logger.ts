import { CONST, tables } from '../consts.js';
import { text } from './text.js';

import terminal from 'terminal-kit';
const term = terminal.terminal;

export const safeStringify = (obj: unknown) => {
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
  stacks: () =>
    //logger.stack.join('.') + '!' + '\n' +
    '│'.repeat(Math.max(0, logger.stack.length - 1)),
  indentString: (noBar?: boolean) =>
    term.str.dim(
      (logger.stacks() || '') + (noBar === true ? '' : '' + logger.stacks()),
    ) as unknown as string,
  dimChar: (text: string) => term.str.dim(text),
  increaseIndent: (indentName?: string) => {
    logger.stack.push(indentName);
    if (indentName) {
      logger.indentLine('╭');

      term(logger.indentString(true) + term.str.dim('│') + indentName + '\n');
      logger.indentLine('├');
    }
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
    logger.indentLine();
    logger.stack.pop();
    if (closer) {
      logger.log(closer);
    }
  },

  indented: <T>(name: string, fn: () => Promise<T>) => {
    logger.increaseIndent(name);
    const starTime = Date.now();
    return new Promise<T>((resolve, reject) => {
      return (typeof fn === 'function' ? fn() : fn)
        .then(val => {
          logger.decreaseIndent(
            text.dim(`✔️  ${name} (${(Date.now() - starTime) / 1000}s)`),
          );
          resolve(val);
        })
        .catch(err => {
          logger.decreaseIndent(
            text.dim(`🔴 ${name} (${(Date.now() - starTime) / 1000}s)`),
          );
          reject(err);
        });
    });
  },

  /** With New line */
  print: (text: string, ...args) => {
    const lines = `${text + safeStringify(args)}`
      .split(/\n|\r/)
      .filter(val => val !== '' && val !== ' ');
    lines.forEach((line, index) =>
      term(`${line}${index !== lines.length - 1 ? '\n' : '\n'}`),
    );
  },

  /** With New line */
  println: (text: string, ...args) => {
    const line = `${text + safeStringify(args)}`;

    term(`${logger.indentString(true)}${logger.dimChar('│')}${line}\n`);
  },
  /** With New line */
  log: (text: string, ...args) => {
    const lines = `${text + safeStringify(args)}`
      .split(/\n|\r/)
      .filter(val => val !== '' && val !== ' ');
    lines.forEach(line =>
      term(`${logger.indentString(true)}${logger.dimChar('│')}${line}\n`),
    );
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
      value: unknown;
      description?: string;
    }[],
  ) => {
    // CLI Parameters
    logger.print(`
${text.strong('\nCLI Command:')}
yarn bema ${name} \\
${variables
  .map(
    variable =>
      `--${variable.option}=${
        typeof variable.value === 'string' //&& variable.value.includes(' ')
          ? `"${variable.value.replace(/\\/g, '\\\\')}"`
          : variable.value
      }`,
  )
  .join(' \\\n')}\n\n`);

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
                  text.strong(variable.value?.toString() || ''),
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

  formatOneLineCommand: (props: {
    cwd: string;
    command: string;
    args: string[];
  }) => {
    const commandStringOneline = `${text.dim(props.cwd || '')}> ${text.strong(
      props.command,
    )}`;

    const argList1String = (
      props.args ? props.args.map(line => text.underline(line)) : []
    ).join(' ');

    return `${commandStringOneline} ${argList1String}`;
  },

  formatMultiLineCommand: (props: {
    cwd: string;
    command: string;
    args: string[];
  }) => {
    const firstArg = props.args.length > 0 ? props.args[0] : '';
    const commandString1 = `${text.dim(props.cwd || '')}>`;
    const commandString2 = `${text.strong(props.command)} ${text.underline(
      firstArg,
    )}`;

    const argList2 = props.args
      ? props.args
          .map((line, index) => (index == 0 ? '' : ' ' + text.underline(line)))
          .filter(line => line.length > 0)
      : [];

    const line2Spacer = ' '.repeat(
      logger.stack.length +
        text.width(commandString1) +
        text.width(commandString2) -
        text.width(firstArg) +
        1,
    );

    return `${commandString1} ${commandString2} \\\n${line2Spacer}${argList2.join(
      ` \\\n${line2Spacer}`,
    )}`;
  },

  startCommand: (props: { cwd: string; command: string; args: string[] }) => {
    const commandStringOneline = logger.formatOneLineCommand(props);
    if (text.width(commandStringOneline) < CONST.terminalWidth) {
      logger.increaseIndent(commandStringOneline);
    } else {
      const commandStringMultiline = logger.formatMultiLineCommand(props);
      logger.increaseIndent(commandStringMultiline);
    }
  },
  endCommand: (props: {
    output: string;
    exitCode: number;
    hideOutput: boolean;
  }) => {
    if (props.output.trim().length > 0) {
      logger.indentLine('├');
    }
    logger.log(
      `${props.exitCode === 0 ? '✅ ' : '🛑 '}${props.exitCode}${
        props.output && props.hideOutput !== true
          ? ' ➡️  ' + text.italic(props.output.trim())
          : ''
      }`,
    );

    logger.decreaseIndent();
    return props.output;
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
