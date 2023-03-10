import { command } from 'bandersnatch';

import { Actions, messageTemplates } from './autoGitReleaseMessage-actions.js';
import { text } from '../utils/text.js';
import { logger } from '../utils/logger.js';
import { cache, gitCommands, gitGetReleaseBranches } from '../utils/git.js';

export type autoGitReleaseMessageType = typeof gitReleaseMessage.defaultArgs;

export const gitReleaseMessage = {
  title: 'Auto Git Release Message',
  // Default args
  defaultArgs: {
    ['release-name']: '' as string,
    ['desc']: '' as string,
    ['from']: '' as string,
    ['to']: '' as string,
    ['ver']: '1.1.32' as string,
    ['beta-build']: 1 as number,
  } as const,

  getReleaseBranches: async () => {
    if (
      !cache.cachedReleaseBranches ||
      cache.cachedReleaseBranches.length == 0
    ) {
      cache.cachedReleaseBranches = await gitCommands.getReleaseBranchNames();
    }

    return gitGetReleaseBranches();
  },

  getAllBranches: async (sortBy: 'committerdate' = 'committerdate') => {
    const branches = (await gitCommands.gitBranch(sortBy)).all.filter(
      line => line.includes('->') === false,
    );

    return branches;
  },

  getNonReleaseBranches: async (limit = 20) => {
    return await gitCommands.getAllBranchNames(
      'committerdate',
      limit,
      false,
      line => line.toLowerCase().includes('release') === false,
    );
  },
  cmd: async () => {
    // const releaseData = await autoGitReleaseMessage.getReleaseBranches();

    return command('git-release')
      .description(`Generates a commit message for a new release`)

      .option('release-name', {
        description: `provide a release name: (${text.strong('FEB_2023')}): `,
        prompt: true,

        // default: '',
        string: true,
        type: 'string',
      })

      .option('desc', {
        description: `Please provide a short primary release description (eg. Feature X, Bug Y, etc.): `,

        prompt: true,
        //default: 'Feature X, Bug Y, etc.',
        string: true,
        type: 'string',
      })

      .option('ver', {
        description: `provide the new version number ((${text.strong(
          `eg. ${gitReleaseMessage.defaultArgs['ver']}`,
        )}): `,
        prompt: true,
        string: true,
        type: 'string',
      })
      .option('beta-build', {
        description: `Which beta build / RC is this for the release (Usually 1)? `,

        prompt: true,

        string: true,
        type: 'number',
      })

      .option('from', {
        description: `Existing release branch/sha without new changes (${text.strong(
          'eg. origin/master',
        )}): `,
        prompt: true,

        // default: 'origin/release/2/1/33-<JIRAProjectKey>-701-UIFixes',
        string: true,
        type: 'string',
      })

      .option('to', {
        description: `Latest branch/sha with new changes (${text.strong(
          'eg. origin/master',
        )}): `,
        prompt: true,

        // default: 'origin/develop',
        string: true,
        type: 'string',
      })

      .action(async args => {
        try {
          const params = {
            ...gitReleaseMessage.defaultArgs,
            ...args,
          } as typeof gitReleaseMessage.defaultArgs;

          logger.variableTable(
            'git-release',
            Object.keys(gitReleaseMessage.defaultArgs).map(
              (key: keyof autoGitReleaseMessageType) => ({
                option: key,
                value: params[key],
              }),
            ),
          );

          logger.indented(
            '📦 Automated Create releaseMessage Version',
            async () => {
              const trainsAndTickets = await Actions.getTrainsAndTickets(
                params['from'],
                params['to'],
              );

              logger.println(
                '\n' +
                  messageTemplates.releaseBuild({
                    releaseName: params['release-name'],
                    jiraTickets: trainsAndTickets,
                    version: params['ver'],
                    betaVersion: params['beta-build'],

                    releaseDescription: params['desc'],
                  }),
              );
            },
          );

          return params;
        } catch (e) {
          logger.errorStack(e.message);
          throw e;
        }
      });
  },
};
