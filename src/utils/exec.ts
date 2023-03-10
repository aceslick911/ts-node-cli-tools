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
  hideOutput?: boolean;
}

interface IManagedProcess {
  promise: Promise<{ code: number; data: string }>;
  kill: () => void;
}

const childExecFile = (props: IRunAsyncCommandProps): IManagedProcess => {
  const { command, args, onData, onErr, cwd } = props;

  const resolvedCWD =
    (cwd && getRelativePath('./' + cwd)) || getRelativePath('./');
  const commandDesc = `${text.strong(command)} ${text.strong(
    args.join(' '),
  )} (in ${text.italic(resolvedCWD)})`;
  const { title = '' } = props;

  const errors = [];
  const output = [];

  const managedProcess = {
    child: null,
    kill: () => {
      logger.error('KILLED!1');
      if (managedProcess.child) {
        logger.error('KILLED!2');
        managedProcess.child.kill('SIGINT');
        managedProcess.child = null;
      }
    },
  };

  try {
    return {
      promise: new Promise<{ code: number; data: string }>(
        (resolve, reject) => {
          managedProcess.child = execFile(command, args, {
            cwd: resolvedCWD,
          });

          managedProcess.child.stderr.addListener('data', data => {
            errors.push(data);
            if (onErr) {
              onErr(data);
            } else {
              logger.warn(data + '\n');
            }
          });

          managedProcess.child.stdout.addListener('data', data => {
            output.push(data);
            if (onData) {
              onData(data);
            } else {
              if (CONST.VERBOSE && props.hideOutput !== true) {
                logger.log(text.italic(data.trim()));
              } else {
                logger.log(
                  text.italic(
                    `${data.trim().split('\n').length} output lines hidden.`,
                  ),
                );
              }
            }
          });

          managedProcess.child.on('close', code => {
            if (code !== 0) {
              reject(code);
            } else {
              resolve({ code: 0, data: output.join('\n') });
            }
          });
        },
      ),
      kill: managedProcess.kill,
    };
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
  logger.startCommand({
    cwd: props.cwd,
    command: props.command,
    args: props.args,
  });
  const childProcess = childExecFile(props);

  return childProcess.promise.then(({ code, data }) =>
    logger.endCommand({
      output: data,
      exitCode: code,
      hideOutput: props.hideOutput,
    }),
  );
};

/** Executes a command and returns the output async */
export const runAsyncCommandManaged = (
  props: IRunAsyncCommandProps,
): Promise<IManagedProcess> =>
  new Promise((resolve, reject) => {
    logger.startCommand({
      cwd: props.cwd,
      command: props.command,
      args: props.args,
    });
    const childProcess = childExecFile(props);

    resolve(childProcess);

    childProcess.promise
      .then(({ code, data }) => {
        logger.endCommand({
          output: data,
          exitCode: code,
          hideOutput: props.hideOutput,
        });
      })
      .catch(err => {
        logger.error(err);
        reject(err);
      });
  });
