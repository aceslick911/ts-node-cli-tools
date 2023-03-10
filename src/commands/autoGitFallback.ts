import { command } from 'bandersnatch';

import { Actions } from './autoGitFallback-actions.js';
import { text } from '../utils/text.js';
import { logger } from '../utils/logger.js';

export type autoGitFallbackType = typeof gitFallback.defaultArgs;

export const gitFallback = {
  title: 'Auto Git Fallback',
  // Default args
  defaultArgs: {
    ['release-name']: '' as string,
    ['release-to']: '' as string,
    ['from']: '' as string,
    ['to']: '' as string,
    ['ver']: '1.1.32' as string,
  } as const,

  cmd: async () => {
    // const data = { releases: await gitCommands.getReleaseBranches() };

    return command('git-fallback')
      .description(
        `Creates a new branch in git for the fallback version, commits a release note and provides links to trigger bitrise`,
      )

      .option('from', {
        description: `provide the name if the latest release branch to fallback from`,
        prompt: `Active release branch name: (${text.strong(
          'current prod - to fallback from',
        )})`,

        string: true,
        type: 'string',
      })

      .option('release-name', {
        description: `Current release falling back from: (${text.strong(
          'FEB_2023',
        )}): `,
        prompt: true,

        string: true,
        type: 'string',
      })

      .option('release-to', {
        description: `Older Release Description: (${text.strong(
          'JAN_2023',
        )}): `,
        prompt: true,

        string: true,
        type: 'string',
      })
      .option('to', {
        description: `Target Release branch/sha: (${text.strong(
          'fallback target - to fallback to',
        )})`,
        prompt: true,
        // choices: [...data.releases],

        string: true,
        type: 'string',
      })

      .option('ver', {
        description: `Existing version number: (${text.strong(
          'fallback target - to fallback to',
        )})`,
        prompt: true,
        // choices: [...data.releases],

        string: true,
        type: 'string',
      })

      .action(async args => {
        try {
          const params = {
            ...gitFallback.defaultArgs,
            ...args,
          } as typeof gitFallback.defaultArgs;

          logger.variableTable(
            'git-fallback',
            Object.keys(gitFallback.defaultArgs as autoGitFallbackType).map(
              key => ({
                option: key,
                value: params[key],
              }),
            ),
          );
          logger.indented('📦 Automated Create Fallback Version', async () => {
            // Todo: Finish implementation

            logger.println(
              Actions.fallbackBuild({
                liveVersion: {
                  version: params.ver,
                  /** Release Name of last release to fallback to (before the fallback version bump)*/
                  releaseName: params['release-to'],
                },
                fallbackVersion: {
                  /** Version of last release to fallback to (before the fallback version bump)
                   * eg: 2.1.28 */
                  version: params.to,
                  releaseName: params['release-name'],
                  /** Commit SHA of last release to fallback to (before the fallback version bump)*/
                  sha: params.to,

                  /** Date of last release to fallback to (before the fallback version bump)*/
                  date: '01-01-2021',
                  /** Jira tickets that would be rolled back */
                  jiraTickets: [
                    {
                      ticket: 'test',
                      message: 'test2',
                    },
                  ],
                },
              }),
            );

            logger.log(`✅ Build complete: auto-git-fallback`);
          });

          return params;
        } catch (e) {
          logger.errorStack(e.message);
          throw e;
        }
      });
  },
};
