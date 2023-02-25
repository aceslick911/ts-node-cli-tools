import { CONST } from '../consts.js';
import { logger } from './logger.js';
import { text } from './text.js';
import { getRelativePath, renderRegexMatches } from './utils.js';

import terminal from 'terminal-kit';

import fs from 'fs';

export const readTextFile = (filename: string) =>
  new Promise<string>((resolve, reject) => {
    fs.readFile(getRelativePath(filename), 'utf8', (err, data) => {
      if (err) {
        logger.error(!CONST.VERBOSE ? 'ERROR' : err.message);
        reject(err);
        return;
      }
      resolve(data);
    });
  });

export const readJSONFile = async (filename: string) =>
  await readTextFile(filename).then(data => JSON.parse(data));

export const writeTextFile = (
  relativePath: string,
  data: string,
  preview?: RegExp,
) => {
  // logger.log('writeTextFile', relativePath);
  return new Promise((resolve, reject) => {
    fs.writeFile(getRelativePath(relativePath), data, 'utf8', err => {
      if (err) {
        logger.error(!CONST.VERBOSE ? 'ERROR' : err.message);
        reject(err);
        return;
      }
      if (preview) {
        renderRegexMatches(preview, data);
      }
      resolve(true);
    });
  });
};

export const updatePackageHomepage = (homepage: string) =>
  new Promise((resolve, reject) => {
    fs.readFile(getRelativePath('package.json'), 'utf8', (err, data) => {
      if (err) {
        logger.error(!CONST.VERBOSE ? 'ERROR' : err.message);
        reject(err);
        return;
      }
      const json = JSON.parse(data);
      json.homepage = homepage;
      fs.writeFile(
        getRelativePath('package.json'),
        JSON.stringify(json, null, 2),
        'utf8',
        err => {
          if (err) {
            logger.error(!CONST.VERBOSE ? 'ERROR' : err.message);
            reject(err);
            return;
          }
          logger.log('homepage set to', homepage);
          resolve(true);
        },
      );
    });
  });

export const deleteFile = (APP_CONFIG_FILENAME: string, throwError?: boolean) =>
  new Promise((resolve, reject) => {
    try {
      fs.unlinkSync(APP_CONFIG_FILENAME);
      logger.log('Deleted file:', APP_CONFIG_FILENAME);
      resolve(true);
    } catch (e) {
      if (throwError) {
        logger.error(
          'Error deleting file:' + APP_CONFIG_FILENAME,
          !CONST.VERBOSE ? 'ERROR' : e,
        );
        reject(e);
      } else {
        logger.log('Skipped deleting file:', APP_CONFIG_FILENAME);
        resolve(true);
      }
    }
  });

export const copyFile = (
  sourceRelativePath: string,
  targetRelativePath: string,
  override?: boolean,
  preview?: RegExp,
) =>
  new Promise((resolve, reject) => {
    try {
      const source = getRelativePath(sourceRelativePath);
      const target = getRelativePath(targetRelativePath);
      try {
        if (fs.existsSync(target) && !override) {
          logger.log('Skipped copying file:', source);
          resolve(true);
        } else {
          fs.copyFileSync(source, target);
          logger.log('Copied file:', source);
          if (preview) {
            previewFile(targetRelativePath, preview).then(() => resolve(true));
          } else {
            resolve(true);
          }
        }
      } catch (e) {
        logger.error(
          `Error copying file from ${source} to ${target}`,
          !CONST.VERBOSE ? 'ERROR' : e,
        );
        reject(e);
      }
    } catch (e) {
      logger.error(
        'Error copying ${source} to ${target}',
        !CONST.VERBOSE ? 'ERROR' : e,
      );
      reject(e);
    }
  });

export const regexReplaceInFile = async(
  relativePath: string,
  reg: RegExp,
  replace: string,
) =>{
    try {
      const target = getRelativePath(relativePath);
 
        const data = await readTextFile(target);

        const result = data.replace(reg, replace);

        logger.log(`Updated: ${text.strong(relativePath)}`);
        renderRegexMatches(reg, data);

        logger.log(`${'To:'}`);

        renderRegexMatches(reg, result);

        return (result);
     
    } catch (e) {
      logger.error(
        'Error reading file:',
        relativePath,
        !CONST.VERBOSE ? 'ERROR' : e.message,
      );
      throw e;
    }
  };

export const previewFile = async (targetRelativePath: string, reg?: RegExp) => {
  const data = await readTextFile(targetRelativePath);

  if (reg) {
    logger.log(`
  Previewing: ${text.strong(targetRelativePath)}`);
    let match;
    while ((match = reg.exec(data)) !== null) {
      logger.log(
        `  [${text.strong(match.index)}-${text.strong(
          match.index + terminal.stringWidth(match[0]),
        )}]: ${text.italic(match[0])}`,
      );
    }
  } else {
    logger.log('Previewing file:', targetRelativePath);
    logger.log(text.italic(data));
  }
};
