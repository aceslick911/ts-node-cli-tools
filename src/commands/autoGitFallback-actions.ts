import { logger } from '../utils/logger.js';
import { gitCommands } from '../utils/git.js';

export interface IFallbackTemplateProps {
  liveVersion: {
    version: string;
    /** Release Name of last release to fallback to (before the fallback version bump)*/
    releaseName: string;
  };
  fallbackVersion: {
    /** Version of last release to fallback to (before the fallback version bump)
     * eg: 2.1.28 */
    version: string;
    releaseName: string;
    /** Commit SHA of last release to fallback to (before the fallback version bump)*/
    sha: string;

    /** Date of last release to fallback to (before the fallback version bump)*/
    date: string;
    /** Jira tickets that would be rolled back */
    jiraTickets: { ticket: string; message: string }[];
  };
}

export const Actions = {
  getQaTrainsBetweenCommits: async (from: string, to: string) => {
    return await logger.indented('getQaTrainsBetweenCommits', () =>
      gitCommands.gitCommitsBetween(from, to),
    );
  },

  /**
    ☎️ Fallback Release Build v2.1.34 to v2.1.30 (30/01)
    Fallback release for Feb v1 2023 release 2.1.34
    Rollback to release 2.1.30
    Commit SHA of 2.1.30 - ab5baa070f4f00d22a1fff20e8daa8c2aa6a2437

    2.1.30 Jira Tickets that would be rolled back:

    - <JIRAProjectKey>-XXX: Some ticket
    - <JIRAProjectKey>-XXX: Some ticket
    */
  fallbackBuild: (
    props: IFallbackTemplateProps,
  ) => `☎️ Fallback Release Build v${props.liveVersion.version} to v${
    props.fallbackVersion.version
  } (${props.fallbackVersion.date})
  
Fallback release for ${props.liveVersion.releaseName}
Rollback to release ${props.fallbackVersion.releaseName}
Commit SHA of ${props.fallbackVersion.releaseName} - ${
    props.fallbackVersion.sha
  }

v${props.fallbackVersion.version} Jira Tickets that would be rolled back:
${props.fallbackVersion.jiraTickets
  .map(ticket => `- ${ticket.ticket}: ${ticket.message}`)
  .join('\n')}`,
};
