import { command } from 'bandersnatch';
import { CONST } from '../consts.js';
import { getRelativePath } from '../utils/utils.js';

import { Actions } from './buildWeb-actions.js';
import { text } from '../utils/text.js';
import { logger, progressBar } from '../utils/logger.js';

export type BuildWebParams = {
  platform: 'WEB';
  CONFIG_FILE: readonly string[];
  'root-folder': string;
  config: string;
  test?: boolean;
  sourceDirectory: string;
  cloneDirectory: string;
};

export const buildWebZip = {
  title: 'Build Web Zip',
  // Default args
  defaultArgs: {
    platform: 'WEB',
    CONFIG_FILE: CONST.bema.knownConfigFiles,
    test: false,
  } as const,
  cmd: () =>
    command('build-web-zip') // <--- This is the command name
      .description(
        `Builds a zip file for mobile-web
      ${text.italic(`eg: yarn bema ${text.strong(`build-web-zip`)} \\
      --root-folder=/nmo/ \\
      --config=index.prod.ts`)}`,
      ) // <--- This is the command description (shown when running --help)

      .option('test', {
        description: 'run npx serve to test the build',
        default: false,
        boolean: true,
        type: 'boolean',
      }) // <--- This is an option which will run npx serve at the end of the build

      .option('root-folder', {
        description: `can be any value but must end with a /`,
        prompt: 'url subpath (including trailing /)',
        string: true,
        type: 'string',
      })

      .option('config', {
        prompt: 'environment config',
        choices: CONST.bema.knownConfigFiles,
        coerce: saveToDefault(['config']),
        type: 'string',
      })

      // This is the action that runs if the command is called
      .action(async args => {
        try {
          const params = { ...buildWebZip.defaultArgs, ...args };

          // This helper method will log the options passed in
          // and their values
          // Useful for debugging!
          logger.variableTable('build-web-zip', [
            {
              option: 'root-folder',
              value: params['root-folder'],
              description: 'url subpath',
            },
            {
              option: 'config',
              value: params.config,
              description: 'environment config',
            },
            {
              option: 'test',
              value: params.test
                ? text.green('true')
                : text.red(text.italic('omitted')),
              description: 'runs npx serve',
            },
          ]);

          // Validate
          const { ['root-folder']: rootFolder } = args;
          if (!rootFolder || !rootFolder.endsWith('/')) {
            const err = 'root-folder Must be defined and end with a trailing slash';
            throw new Error(err);
          }

          // This indented method will log the title and keeps track of
          // the async method until it finishes.
          // It will also add an indent to the log output for easier reading
          logger.indented('📦 Building Mobile Web Artifact', async () => {
            const sourceDirectoryRelative = `./web-build${rootFolder}`;
            const sourceDirectory = getRelativePath(sourceDirectoryRelative);
            const cloneDirectory = getRelativePath(
              `./web-build${rootFolder.substring(
                0,
                rootFolder.length - 1,
              )}${rootFolder}`,
            );

            // This async method runs the build process with the given parameters
            await mobileWebBuildProcess({
              ...params,
              ['root-folder']:rootFolder,
              sourceDirectory,
              cloneDirectory,
            });

            logger.log(`✅ Build complete: build-web-zip`);

            if (params.test) {
              logger.log(`🧪 Running npx serve to test the build...`);

              logger.log(
                `🧪 Cloning subdirectory from ${sourceDirectory} to ${cloneDirectory}...`,
              );

              if (
                getRelativePath(sourceDirectory) ===
                getRelativePath(cloneDirectory)
              ) {
                logger.log(
                  '🧪 Skipping clone because source and destination are the same',
                );
              } else {
                await Actions.Create_CloneSubfolder(
                  sourceDirectory,
                  cloneDirectory,
                );

                await Actions.Clone_To_Subfolder(
                  sourceDirectory,
                  cloneDirectory,
                );

                await Actions.Write_npx_serve_config(
                  sourceDirectory,
                  rootFolder,
                );
              }

              await logger.npxTable(sourceDirectoryRelative, rootFolder);

              await Actions.run_npx_serve(sourceDirectoryRelative, data => {
                logger.log(text.italic(data.trim()));
              });
            }
          });

          return params;
        } catch (e) {
          logger.errorStack(e.message);
          throw e;
        }
      }),
};

const mobileWebBuildProcess = async (params: BuildWebParams) => {
  try {
    const progress = progressBar({
      title: `Building ${CONST.bema.webArtifactName}`,
      items: 4,
      eta: false,
      percent: false,
    });

    // Update version numbers so web has the correct version (uses version.json)
    progress.startItem(`Update version numbers`);
    await Actions.Update_Versions();
    progress.itemDone(`Update version numbers`);

    // DISABLED
    // Delete the files
    // progress.startItem(`Delete existing artifacts`);
    // await Actions.Delete_Existing_Zips(params);
    // progress.itemDone(`Delete existing artifacts`);


    // Run Expo
    progress.startItem(`Expo build web`);
    await Actions.Run_Expo_Web_Build(params, data => {
      logger.log(data);
    }),
      progress.itemDone(`Expo build web`);

    if (
      getRelativePath(params.sourceDirectory) !==
      getRelativePath(params.cloneDirectory)
    ) {
      progress.startItem(`Prepare artifacts`);

      // Put it in a subfolder
      await Actions.Create_Subfolder(params);

      // Move the files
      await Actions.Move_To_Subfolder(params);

      // DISABLED - codebuild is responsible for this
      // // Zip the file
      // await Actions.Zip_Folder(params);

      // DISABLED
      // // Clean up other artifacts
      // await Actions.Cleanup_Artifacts(params);
    } else {
      logger.log(
        `🧪 Skipping subfolder creation because source and destination are the same`,
      );
    }
    progress.itemDone(`Prepare artifacts`);
  } catch (e) {
    logger.errorStack(e.message);
    throw e;
  }
};

// Key-Value helper and updates default props
function saveToDefault(parameterNames: string[]) {
  return val => {
    parameterNames.forEach(element => {
      buildWebZip.defaultArgs[element] = val;
    });

    return val;
  };
}
