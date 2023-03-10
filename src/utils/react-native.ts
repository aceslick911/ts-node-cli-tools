import { runAsyncCommand } from '../utils/exec.js';

import { logger } from '../utils/logger.js';
import {
  readJSONFile,
  regexReplaceInFile,
  writeTextFile,
} from '../utils/files.js';

import { text } from '../utils/text.js';

import { getRelativePath } from './utils.js';
import { VendorSpecificValues } from '../consts.js';

export type BuildWebParams = {
  platform: 'WEB';
  CONFIG_FILE: readonly string[];
  'root-folder': string;
  config: string;
  test?: boolean;
};

export interface ISetVersions {
  APP_VERSION: string;
  BUILD_NUMBER: number;
  LAST_RELEASE: string;
  XCODE_PROJ?: string;
}

const buildArtifacts = {
  files: [
    '.well-known',
    'apple-app-site-association',
    'apple-touch-icon.png',
    'asset-manifest.json',
    'fonts',
    'index.html',
    'manifest.json',
    'serve.json',
    'static',
  ],
};

export const setVersions = async (versionOverrides?: ISetVersions) => {
  try {
    const packageJson = await readJSONFile(getRelativePath('package.json'));

    const BUILD_NUMER = VendorSpecificValues.buildNumber;

    const versionInfo = {
      APP_VERSION: packageJson.version,
      BUILD_NUMBER: BUILD_NUMER,

      LAST_RELEASE: packageJson.version,

      ...(versionOverrides || {}),
    };

    await updateProjectPbx(versionInfo);
    await updateVersionJsonFile(versionInfo);
    await updateAppJsonFile(versionInfo);
  } catch (e) {
    logger.error('setVersions error: ' + e);
    throw e;
  }
};

const runBuildWebZip = (updateProgress: (progress: string) => void) =>
  runAsyncCommand({
    title: 'Waiting for "expo: build:web" ..',
    command: 'expo',
    args: ['build:web'],
    onData: data => {
      updateProgress(data);
    },
    onErr: err => {
      logger.warn(err + '\n');
    },
  });

export const Actions = {
  // Delete the files
  Delete_Existing_Zips: (zipFileName: string) =>
    logger.indented(text.strong('▶️  Delete_Existing_Zips'), () =>
      runAsyncCommand({
        title: 'Cleaning up any existing zip files..',
        cwd: './',
        command: 'rm',
        args: ['-f', `./${zipFileName}`],
      }),
    ),

  // Run it!
  Run_Expo_Web_Build: (params: BuildWebParams, updateProgress) =>
    logger.indented(text.strong('▶️  Run_Expo_Web_Build'), () =>
      runBuildWebZip(updateProgress),
    ),

  // Put it in a subfolder
  Create_Subfolder: async (params: BuildWebParams) =>
    await logger.indented(text.strong('▶️  Create_Subfolder'), () =>
      runAsyncCommand({
        title: 'Creating subfolder..',
        cwd: './web-build/',
        command: 'mkdir',
        args: ['-p', `.${params['root-folder']}`],
      }),
    ),

  // Move the files
  Move_To_Subfolder: async (params: BuildWebParams) =>
    await logger.indented(text.strong('▶️  Move_To_Subfolder'), () =>
      runAsyncCommand({
        title: 'Moving files to subfolder..',
        cwd: './web-build/',
        command: 'mv',
        args: ['-f', ...buildArtifacts.files, `.${params['root-folder']}`],
      }),
    ),
  // Zip the file
  Zip_Folder: async (params: BuildWebParams, zipFileName: string) =>
    await logger.indented(text.strong('▶️  Zip_Folder'), () =>
      runAsyncCommand({
        title: 'Zipping files..',
        cwd: './web-build/',
        command: 'zip',
        args: ['-r', `${zipFileName}`, './'],
      }),
    ),

  // Clean up other artifacts
  Cleanup_Artifacts: async (params: BuildWebParams) =>
    await logger.indented(text.strong('▶️  Cleanup_Artifacts'), () =>
      runAsyncCommand({
        title: 'Cleaning up..',
        command: 'rm',
        cwd: './web-build/',
        args: ['-rf', `.${params['root-folder']}`],
      }),
    ),

  // Create subfolder
  Create_CloneSubfolder: async (sourceDirectory, cloneDirectory: string) =>
    await logger.indented(text.strong('▶️  Create_CloneSubfolder'), () =>
      runAsyncCommand({
        title: 'Creating subfolder..',

        command: 'mkdir',
        args: ['-p', cloneDirectory],
      }),
    ),

  // Clone to subfolder
  Clone_To_Subfolder: async (sourceDirectory, cloneDirectory: string) =>
    await logger.indented(text.strong('▶️  Clone_To_Subfolder'), () =>
      runAsyncCommand({
        title: 'Moving files to subfolder..',

        command: 'cp',
        args: [
          '-rf',
          ...buildArtifacts.files.map(file => `${sourceDirectory}/${file}`),
          cloneDirectory,
        ],
      }),
    ),

  Write_npx_serve_config: async (sourceDirectory: string, rootFolder: string) =>
    await logger.indented(text.strong('▶️  write_npx_serve_config'), () =>
      writeTextFile(
        `${sourceDirectory}/serve.json`,
        JSON.stringify({
          headers: [
            {
              source: 'static/**/*.js',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
          ],
          rewrites: [
            {
              source: `${rootFolder}/**`,
              destination: '/index.html',
            },
          ],
        }),
      ),
    ),

  //Run npx serve
  run_npx_serve: async (sourceDirectory: string, updateProgress) => {
    await runAsyncCommand({
      title: 'Waiting for "npx serve" ..',
      cwd: sourceDirectory,
      command: 'npx',
      args: ['-q', 'serve', '-l', '3000'],
      onData: data => {
        updateProgress(data.toString());
      },
      onErr: err => {
        logger.errorStack(err.toString());
      },
    });

    return sourceDirectory;
  },
};

export type ISetVersionReplace = (_props: ISetVersions) => Promise<void>;

/** Sets the marketing version in the project.pbxproj files to APP_VERSION */
export const updateProjectPbx: ISetVersionReplace = async ({
  APP_VERSION,
  XCODE_PROJ,
}) => {
  const prebuildFile = `./ios/${XCODE_PROJ}/project.pbxproj`;
  const iosProjectFile = `./assets/prebuild/ios/${XCODE_PROJ}.xcodeproj/project.pbxproj`;

  const prebuildData = await regexReplaceInFile(
    prebuildFile,
    /(.*)MARKETING_VERSION.*/g,
    `$1MARKETING_VERSION = ${APP_VERSION};`,
  );
  await writeTextFile(prebuildFile, prebuildData, /.*MARKETING_VERSION.*/g);

  const projectData = await regexReplaceInFile(
    iosProjectFile,
    /(.*)MARKETING_VERSION.*/g,
    `$1MARKETING_VERSION = ${APP_VERSION};`,
  );
  await writeTextFile(iosProjectFile, projectData, /.*MARKETING_VERSION.*/g);
};

/** Sets the version and build number in the Config/version.json file to APP_VERSION and BUILD_NUMBER*/
export const updateVersionJsonFile: ISetVersionReplace = async ({
  APP_VERSION,
  BUILD_NUMBER,
}) => {
  const file = './App/Config/version.json';

  const data = await regexReplaceInFile(
    file,
    /(.*)major.*/g,
    `$1major": "${APP_VERSION}",`,
  );

  await writeTextFile(file, data, /.*MARKETING_VERSION.*/g);

  await regexReplaceInFile(
    file,
    /(.*)minor.*/g,
    `$1minor": "${BUILD_NUMBER}",`,
  );
};

/** Sets the version, release-version, last-release in app.json to APP_VERSION and LAST_RELEASE*/
export const updateAppJsonFile: ISetVersionReplace = async ({
  APP_VERSION,
  LAST_RELEASE,
}) => {
  const file = './app.json';

  await writeTextFile(
    file,
    await regexReplaceInFile(
      file,
      /(.*)"version".*/g,
      `$1"version": "${APP_VERSION}",`,
    ),
  );

  await writeTextFile(
    file,
    await regexReplaceInFile(
      file,
      /(.*)"release-version".*/g,
      `$1"release-version": "${APP_VERSION}",`,
    ),
  );

  await writeTextFile(
    file,
    await regexReplaceInFile(
      file,
      /(.*)"last-release".*/g,
      `$1"last-release": "${LAST_RELEASE}",`,
    ),
  );
};
