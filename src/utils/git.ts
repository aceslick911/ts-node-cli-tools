import { runAsyncCommand } from './exec.js';
import { logger } from './logger.js';

import debug from 'debug';

import { simpleGit } from 'simple-git';
import _ from 'lodash';

debug.enable('simple-git,simple-git:task*');

const git = {
  bema: simpleGit(),
};

export const gitCommands = {
  getAllBranchNames: (
    sortBy: 'committerdate' = 'committerdate',
    limitTo = 100,
    removeOrigin = true,
    filter?: (branchName: string) => boolean,
  ) =>
    logger.indented(
      `git branch sortBy:${sortBy} limitTo:${limitTo}`,
      async () => {
        await gitCommands.gitFetch();
        return _.uniq(
          (await gitCommands.gitBranch(sortBy)).all

            .map(line => line.trim())
            .filter(line => line.length > 0)
            .reverse()
            .splice(0, limitTo)

            .map(line => {
              const cleanup = /(.*) -> (.*)/;
              const matches = line.match(cleanup);
              if (matches && matches.length > 1) {
                return matches[2];
              }
              return line;
            })
            .map(line => {
              if (removeOrigin === false) return line;
              const cleanup = /(origin\/)(.*)/;
              const matches = line.match(cleanup);
              if (matches && matches.length > 1) {
                return matches[2];
              }
              return line;
            })

            .filter(filter || (() => true)),
        );
      },
    ),
  getReleaseBranches: async (refresh = false) => {
    if (refresh) {
      cache.cachedReleaseBranches = await gitCommands.getReleaseBranchNames();
    }

    return gitCommands.getReleaseBranchNames();
  },
  /** Gets all the release/ branches and organises them */
  // getReleaseBranchNames: (
  //   sortBy: 'committerdate' = 'committerdate',
  //   limitTo = 100,
  // ) =>
  //   commands.getAllBranchNames(
  //     sortBy,
  //     limitTo,
  //     true,
  //     line =>
  //       line.toLocaleLowerCase().includes('origin/release') &&
  //       line.endsWith('/') === false,
  //   ),

  /** Gets all the release/ branches and organises them */
  getReleaseBranchNames: (
    sortBy: 'committerdate' = 'committerdate',
    limitTo = 100,
  ) =>
    logger.indented(
      `git branch sortBy:${sortBy} limitTo:${limitTo}`,
      async () => {
        await gitCommands.gitFetch();
        return (await gitCommands.gitBranch(sortBy)).all
          .filter(
            line =>
              line.toLocaleLowerCase().includes('origin/release') &&
              line.endsWith('/') === false,
          )
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .reverse()
          .splice(0, limitTo)

          .map(line => {
            const cleanup = /"(.*) -> (.*)"/;
            const matches = line.match(cleanup);
            if (matches && matches.length > 1) {
              return matches[2];
            }
            return line;
          })
          .map(line => {
            const cleanup = /(origin\/)(.*)/;
            const matches = line.match(cleanup);
            if (matches && matches.length > 1) {
              return matches[2];
            }
            return line;
          });
      },
    ),

  gitCommitsBetween: async (from: string, to: string) =>
    await git.bema.log<{
      hash: string;
      date: string;
      message: string;
      refs?: string;
      body: string;
      author_name: string;
      author_email: string;
    }>( //@ts-ignore
      {
        from,
        to,

        format: '%cnò%hò%cdò%Bò%aI', //ò is just a separator, see git-scm for more info on pretty formats
        strictDate: true,
        multiLine: true,
      },
      // gitLogger('git log'),
    ),

  gitLsRemote: async (remote = 'origin') =>
    (await runAsyncCommand({
      title: 'Getting git build count',
      command: 'git',
      args: ['ls-remote', remote],
    })) as string,

  gitFetch: async (prune = true) => {
    return await git.bema.fetch(
      'origin',
      'master',

      // gitLogger('git fetch'),
    );
  },

  gitBranch: async (sortBy: 'committerdate' = 'committerdate') =>
    await git.bema.branch(
      { ['-r']: null, ['--sort']: sortBy },

      // gitLogger('git branch'),
    ),

  getComittMessage: async (shaOrBranch: string) =>
    (await runAsyncCommand({
      title: 'Getting git build count',
      command: 'git',
      args: ['--no-pager', 'log', '--format=%B', '-n', '1', shaOrBranch],
    })) as string,
};

export const cache = {
  cachedReleaseBranches: [] as Awaited<
    ReturnType<typeof gitCommands['getReleaseBranchNames']>
  >,
};

export const gitGetReleaseBranches = async () => {
  const releases = cache.cachedReleaseBranches.map(branchName => {
    // release/2/1/33-<JIRAProjectKey>-701-UIFixes
    const branchFolders = branchName.split('/'); //["release", "2", "1", "33-<JIRAProjectKey>-701-MobileWeb-FEB2023-UIFixes"]
    const versionFolders = branchFolders.splice(1, 2); //[2, 1]
    const leafFolder = branchFolders.splice(branchFolders.length - 1, 1)[0]; //33-<JIRAProjectKey>-701-MobileWeb-FEB2023-UIFixes
    const leafSegments = leafFolder.split('-'); //["33", "<JIRAProjectKey>", "701", "MobileWeb", "FEB2023", "UIFixes"]
    const releaseNumber = {
      major: versionFolders[0],
      minor: versionFolders[1],
      patch: leafSegments[0],
    };
    const fallback = branchName.toLocaleLowerCase().includes('fallback');

    return {
      branchName,
      releaseNumber,
      fallback,
    };
  });

  const mostRecentRelease = releases.find(release => release.fallback == false);
  const secondMostRecentRelease = releases.find(
    release =>
      release.fallback == false &&
      mostRecentRelease &&
      release.branchName != mostRecentRelease.branchName,
  );

  return {
    mostRecentRelease,
    secondMostRecentRelease,

    other: releases.filter(
      release =>
        release.fallback == false &&
        mostRecentRelease &&
        release.branchName != mostRecentRelease.branchName &&
        secondMostRecentRelease &&
        release.branchName != secondMostRecentRelease.branchName,
    ),
  };
};
