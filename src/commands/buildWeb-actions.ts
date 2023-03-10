import { CONST } from '../consts.js';
import { runAsyncCommand } from '../utils/exec.js';

import type { BuildWebParams } from './buildWeb.js';
import { logger } from '../utils/logger.js';
import { writeTextFile } from '../utils/files.js';

import { setVersions } from '../utils/react-native.js';
import { text } from '../utils/text.js';

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
  Update_Versions: () =>
    logger.indented(text.strong('Update_Versions'), () => setVersions()),

  // Delete the files
  Delete_Existing_Zips: () =>
    logger.indented(text.strong('Delete_Existing_Zips'), () =>
      runAsyncCommand({
        title: 'Cleaning up any existing zip files..',
        cwd: './',
        command: 'rm',
        args: ['-f', `./${CONST.bema.webArtifactName}`],
      }),
    ),

  // Run it!
  Run_Expo_Web_Build: (params: BuildWebParams, updateProgress) =>
    logger.indented(text.strong('Run_Expo_Web_Build'), () =>
      runBuildWebZip(updateProgress),
    ),

  // Put it in a subfolder
  Create_Subfolder: async (params: BuildWebParams) =>
    await logger.indented(text.strong('Create_Subfolder'), () =>
      runAsyncCommand({
        title: 'Creating subfolder..',
        cwd: './web-build/',
        command: 'mkdir',
        args: ['-p', `.${params['root-folder']}`],
      }),
    ),

  // Move the files
  Move_To_Subfolder: async (params: BuildWebParams) =>
    await logger.indented(text.strong('Move_To_Subfolder'), () =>
      runAsyncCommand({
        title: 'Moving files to subfolder..',
        cwd: './web-build/',
        command: 'mv',
        args: [
          '-f',
          ...CONST.bema.buildArtifacts.files,
          `.${params['root-folder']}`,
        ],
      }),
    ),
  // Zip the file
  Zip_Folder: async (params: BuildWebParams) =>
    await logger.indented(text.strong('Zip_Folder'), () =>
      runAsyncCommand({
        title: 'Zipping files..',
        cwd: './web-build/',
        command: 'zip',
        args: ['-r', `${CONST.bema.webArtifactName}`, './'],
      }),
    ),

  // Clean up other artifacts
  Cleanup_Artifacts: async (params: BuildWebParams) =>
    await logger.indented(text.strong('Cleanup_Artifacts'), () =>
      runAsyncCommand({
        title: 'Cleaning up..',
        command: 'rm',
        cwd: './web-build/',
        args: ['-rf', `.${params['root-folder']}`],
      }),
    ),

  // Create subfolder
  Create_CloneSubfolder: async (sourceDirectory, cloneDirectory: string) =>
    await logger.indented(text.strong('Create_CloneSubfolder'), () =>
      runAsyncCommand({
        title: 'Creating subfolder..',

        command: 'mkdir',
        args: ['-p', cloneDirectory],
      }),
    ),

  // Clone to subfolder
  Clone_To_Subfolder: async (sourceDirectory, cloneDirectory: string) =>
    await logger.indented(text.strong('Clone_To_Subfolder'), () =>
      runAsyncCommand({
        title: 'Moving files to subfolder..',

        command: 'cp',
        args: [
          '-rf',
          ...CONST.bema.buildArtifacts.files.map(
            file => `${sourceDirectory}/${file}`,
          ),
          cloneDirectory,
        ],
      }),
    ),

  Write_npx_serve_config: async (sourceDirectory: string, rootFolder: string) =>
    await logger.indented(text.strong('write_npx_serve_config'), () =>
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
