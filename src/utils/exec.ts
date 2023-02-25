import { CONST } from '../consts.js';
import { logger } from './logger.js';
import { text } from './text.js';
import { getRelativePath } from './utils.js';
import { execFile } from 'child_process';

interface IRunAsyncCommandProps {
  command: string;
  args: string[];
  onData?: (data: string) => void;
  onErr?: (data: string) => void;
  /// folder to run the command in
  cwd?: string;
  title?: string;
}

const childExecFile = async (
  props: IRunAsyncCommandProps,
): Promise<{ code: number; data: string }> => {
  const { command, args, onData, onErr, cwd } = props;

  const resolvedCWD =
    (cwd && getRelativePath('./' + cwd)) || getRelativePath('./');
  const commandDesc = `${text.strong(command)} ${text.strong(
    args.join(' '),
  )} (in ${text.italic(resolvedCWD)})`;
  const { title = '' } = props;

  const errors = [];
  const output = [];

  try {
    return await new Promise<{ code: number; data: string }>(
      (resolve, reject) => {
        const child = execFile(command, args, {
          cwd: resolvedCWD,
        });

        child.stderr.addListener('data', data => {
          errors.push(data);
          if (onErr) {
            onErr(data);
          } else {
            logger.warn(data + '\n');
          }
        });

        child.stdout.addListener('data', data => {
          output.push(data);
          if (onData) {
            onData(data);
          } else {
            logger.log(text.italic(data.trim()));
          }
        });

        child.on('close', code => {
          // logger.log(`\n${commandDesc} finished code:`, code); //, '\n');

          if (code !== 0) {
            reject(code);
          } else {
            resolve({ code: 0, data: output.join('\n') });
          }
        });

        // child.stderr.addListener('readable', data => {
        //   const val = child.stderr.read();

        //   console.log(JSON.stringify(val));
        //   errors.push(val);
        //   if (onErr) {
        //     onErr(val);
        //   } else {
        //     logger.warn(val + '\n');
        //   }
        // });
      },
    );
  } catch (err) {
    const msg = `Exited ${err} with error for command: ${commandDesc} ${title} 
Errors:
${errors.join('\n')}`;

    logger.error(msg);
    throw new Error(msg);
  }
};

/** Executes a command and returns the output async */
export const runAsyncCommand = (
  props: IRunAsyncCommandProps,
): Promise<string> => {
  logger.stack.pop();

  const commandString = `${text.dim(props.cwd || '')}> ${text.strong(
    props.command,
  )}`;

  const argList = props.args
    ? props.args.map(line => ' ' + text.underline(line))
    : [];

  const argSpaceString = argList.join('');

  const indentDesc =
    text.width(commandString + argSpaceString) < CONST.terminalWidth
      ? `${commandString}${argSpaceString}`
      : `${commandString} ${argList.join(' \\ \n')}`;

  logger.increaseIndent(`${indentDesc}`);
  const parentMethod = logger.stack.pop();
  return childExecFile(props).then(({ code, data }) => {
    logger.stack.pop();
    if (data.trim().length > 0) {
      logger.indentLine('├');
    }
    logger.log(
      `${code === 0 ? '✅ ' : '🛑 '}${code}${
        data ? ' ➡️  ' + text.italic(data.trim()) : ''
      }`,
    );

    logger.decreaseIndent();
    logger.stack.push(parentMethod);

    return data;
  });
};
