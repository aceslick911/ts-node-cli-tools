import _ from 'lodash';
import { gitCommands } from '../utils/git.js';
import { getRegexMatches } from '../utils/utils.js';

const isQATrain = (message, body: string) => {
  return (
    message.toLowerCase().includes('pull request') &&
    (body.toLowerCase().includes('qa train') ||
      body.toLowerCase().includes('🚂'))
  );
};
const isReleaseTrain = (messageAndBody: string) => {
  return messageAndBody.toLowerCase().includes('🚅');
};

const ticketDescMatcher = /([A-Z]+-[0-9][0-9]+)[:-[ ][\) ]]*(.*)?\n?/g;

const findTicketsInTrainBody = (body: string) => {
  const ticketsInTrain = getRegexMatches(ticketDescMatcher, body).map(match => {
    return {
      ticket: match[0],
      message: match[1],
    };
  });

  return ticketsInTrain;
};
const findTicketsInCommit = (body: string) => {
  const ticketsInBody = getRegexMatches(ticketDescMatcher, body).map(
    (match: string[]) => {
      return {
        ticket: match[0] as string,
        message: match[1].trim() as string,
      };
    },
  );

  return ticketsInBody;
};

export const Actions = {
  getTrainsAndTickets: async (from: string, to: string) => {
    const commits = (await gitCommands.gitCommitsBetween(from, to)).all;

    return _.flatten(
      commits.map(commit => {
        const commitType = isReleaseTrain(commit.body + commit.message)
          ? 'release'
          : isQATrain(commit.message, commit.body)
          ? 'qa train'
          : 'ticket';

        switch (commitType) {
          case 'qa train': {
            const trains = getRegexMatches(
              /(QA Train [0-9\-\.]+)/gi,
              commit.body,
            );

            const ticketsInTrain = findTicketsInTrainBody(commit.body);

            return {
              train: trains.join(', '),
              tickets: ticketsInTrain,
            };
          }
          case 'release': {
            const ticketsInTrain = findTicketsInTrainBody(commit.body);
            return {
              train: commit.body.split('\n')[0], //commit.body.split('\n').join('\n> '),
              tickets: ticketsInTrain,
            };
          }
          case 'ticket': {
            const tickets = findTicketsInCommit(commit.body);
            return tickets;
          }
        }
      }),
    );
  },
};

export interface ITicketCommit {
  ticket: string;
  message: string;
}
export interface ITrainCommit {
  train: string;
  tickets: { ticket: string; message: string }[];
}

export const messageTemplates = {
  /** 🚅 JAN2023 v1.1.32 Beta 1 UAT Train
      New UI features added, some UI fixes. Regression for <JIRAProjectKey>-666.

      Jira Tickets
      - <JIRAProjectKey>-XXX: Some ticket
      - <JIRAProjectKey>-XXX: Some ticket

      Merged in staging (pull request #XX)

      Approved-by: X
      Approved-by: Y
    */
  releaseBuild: (props: {
    releaseName: string; // eg: FEB2023
    version: string; // eg: 2.1.33
    betaVersion: number; // eg: 1
    releaseDescription: string; // eg: New UI features added, some UI fixes. Regression for <JIRAProjectKey>-666.
    jiraTickets: (ITicketCommit | ITrainCommit)[];
    pullRequestNumber?: string; // eg: 3558
    approvedBy?: string[]; // Bitbucket usernames
  }) => {
    const trains = props.jiraTickets.filter(
      ticketOrTrain => 'train' in ticketOrTrain,
    );

    const tickets = _.uniq(
      _.flatten(
        props.jiraTickets.map(ticketOrTrain => {
          if ('train' in ticketOrTrain) {
            return ticketOrTrain.tickets.map(ticket =>
              ticket.ticket.toUpperCase(),
            );
          } else {
            return [
              typeof ticketOrTrain.ticket === 'string'
                ? ticketOrTrain.ticket.toUpperCase()
                : '',
            ];
          }
        }),
      ),
    ) satisfies string[];

    const { version, releaseName, releaseDescription } = props;

    const uniqueTicketCount = tickets.length;
    const betaV = props.betaVersion;

    const jiraTicketList =
      uniqueTicketCount > 0
        ? `\n\nJira Tickets (${uniqueTicketCount})
- ${tickets.join(', ')}`
        : `\n\nNo changes since last release`;

    const trainTicketList = `Trains (${trains.length})
- ${trains
      .map(
        (train: ITicketCommit | ITrainCommit) =>
          'train' in train && (train?.train.split('\n')[0] || train.train),
      )
      .join('\n -')}

Tickets (${uniqueTicketCount})
- ${tickets.join(', ')}`;

    const trainTicketSummary =
      trains.length === 0 ? jiraTicketList : trainTicketList;

    const ticketList = props.jiraTickets
      .map(ticketOrTrain =>
        'train' in ticketOrTrain
          ? '\n> ' +
            ticketOrTrain.train +
            '\n' +
            ticketOrTrain.tickets
              .map(ticket => `- - ${ticket.ticket}: ${ticket.message}`)
              .join('\n') +
            '\n'
          : `- ${ticketOrTrain.ticket}: ${ticketOrTrain.message}`,
      )
      .join('\n');

    const mergeComments = props.pullRequestNumber
      ? `Merged in staging (pull request #${props.pullRequestNumber})`
      : '';

    const approvalList = props.approvedBy
      ? `Approved-by: ${props.approvedBy.join('\n')}`
      : '';

    // Render using template

    return `🚅 ${releaseName} v${version} Beta ${betaV} UAT Train
${releaseDescription}

${trainTicketSummary}
${ticketList}
${mergeComments}

${approvalList}`;
  },
};
