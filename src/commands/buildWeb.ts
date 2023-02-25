import { command } from 'bandersnatch';
import { CONST } from '../consts.js';
import { getRelativePath } from '../utils/utils.js';

// import { Actions } from '../react-native.js';
import { text } from '../utils/text.js';
import { logger, progressBar } from '../utils/logger.js';

export type BuildWebParams = {
  platform: 'WEB';
  CONFIG_FILE: readonly string[];
  'root-folder': string;
  config: string;
  test?: boolean;
};

// export const buildWebZip = {
//   title: 'Build Web Zip',
//   // Default args
//   defaultArgs: {
//     platform: 'WEB',
//     test: false,
//   } as const,
//   cmd: () =>
//     command('build-web-zip')
//       .description(
//         `Builds a zip file for mobile-web
//       --root-folder=/nmo/ \\
//       --config=index.prod.ts`)}`,
//       )

//       .option('test', {
//         description: 'run npx serve to test the build',
//         default: false,
//         boolean: true,
//         type: 'boolean',
//       })

//       .option('root-folder', {
//         description: `one of: ${CONST.paths.join(', ')}`,
//         prompt: 'url subpath (including trailing /)',
//         default: CONST.paths[0],

//         string: true,
//         type: 'string',
//       })

//       .option('config', {
//         prompt: 'environment config',
//         coerce: saveToDefault(['config']),

//         type: 'string',
//       })

//       .action(async args => {
//         try {
//           const ovr = { ...buildWebZip.defaultArgs, ...args };

//           logger.variableTable('build-web-zip', [
//             {
//               option: 'root-folder',
//               description: 'url subpath',
//               value: ovr['root-folder'],
//             },
//             {
//               option: 'config',
//               description: 'environment config',
//               value: ovr.config,
//             },
//             {
//               option: 'test',
//               description: 'runs npx serve',
//               value: ovr.test
//                 ? text.green('true')
//                 : text.red(text.italic('omitted')),
//             },
//           ]);

//           // Validate
//           const { ['root-folder']: rootFolder } = args;
//           if (!rootFolder.endsWith('/')) {
//             const err = 'root-folder Must end with a trailing slash';
//             throw new Error(err);
//           }

//           // Run
//           logger.indented('📦 Building Mobile Web Artifact', async () => {
//             await mobileWebBuildProcess(ovr);


//             if (ovr.test) {
//               logger.log(`🧪 Running npx serve to test the build...`);
//               const sourceDirectoryRelative = `./web-build${ovr['root-folder']}`;
//               const sourceDirectory = getRelativePath(sourceDirectoryRelative);
//               const cloneDirectory = getRelativePath(
//                 `./web-build${ovr['root-folder'].substring(
//                   0,
//                   ovr['root-folder'].length - 1,
//                 )}${ovr['root-folder']}`,
//               );

//               logger.log(
//                 `🧪 Cloning subdirectory from ${sourceDirectory} to ${cloneDirectory}...`,
//               );

//               await Actions.Create_CloneSubfolder(
//                 sourceDirectory,
//                 cloneDirectory,
//               );

//               await Actions.Clone_To_Subfolder(sourceDirectory, cloneDirectory);

//               await Actions.Write_npx_serve_config(sourceDirectory, rootFolder);

//               await logger.npxTable(sourceDirectoryRelative, rootFolder);

//               await Actions.run_npx_serve(sourceDirectoryRelative, data => {
//                 logger.log(text.italic(data.trim()));
//               });
//             }
//           });

//           return ovr;
//         } catch (e) {
//           logger.errorStack(e.message);
//           throw e;
//         }
//       }),
// };

// const mobileWebBuildProcess = async (ovr: BuildWebParams) => {
//   try {
//     const progress = progressBar({
//       items: 4,
//       eta: false,
//       percent: false,
//     });

//     // Update version numbers so web has the correct version (uses version.json)
//     progress.startItem(`Update version numbers`);
//     await Actions.Update_Versions(ovr);
//     progress.itemDone(`Update version numbers`);

//     // DISABLED
//     // Delete the files
//     // progress.startItem(`Delete existing artifacts`);
//     // await Actions.Delete_Existing_Zips(ovr);
//     // progress.itemDone(`Delete existing artifacts`);

//     // Setup Legacy Variables
//     progress.startItem(`Run legacy env setup`);
//     await Actions.Run_Legacy_SetupEnv_({ ...ovr }, data => {
//       logger.log(data);
//     }),
//       progress.itemDone(`Run legacy env setup`);

//     // Run Expo
//     progress.startItem(`Expo build web`);
//     await Actions.Run_Expo_Web_Build(ovr, data => {
//       logger.log(data);
//     }),
//       progress.itemDone(`Expo build web`);

//     progress.startItem(`Prepare artifacts`);

//     // Put it in a subfolder
//     await Actions.Create_Subfolder(ovr);

//     // Move the files
//     await Actions.Move_To_Subfolder(ovr);

//     // DISABLED
//     // // Zip the file
//     // await Actions.Zip_Folder(ovr);

//     // DISABLED
//     // // Clean up other artifacts
//     // await Actions.Cleanup_Artifacts(ovr);

//     progress.itemDone(`Prepare artifacts`);
//   } catch (e) {
//     logger.errorStack(e.message);
//     throw e;
//   }
// };


// // Key-Value helper and updates default props
// function saveToDefault(parameterNames: string[]) {
//   return val => {
//     parameterNames.forEach(element => {
//       buildWebZip.defaultArgs[element] = val;
//     });

//     return val;
//   };
// }
