import { getInput } from '@actions/core';
import { TInputs } from './types';
import * as github from '@actions/github';
import { logDebug } from './logs';
import { formatEvent } from './discord/format';
import { fitEmbed } from './validate';
import { formatEventSlack } from './slack/format';

export const statusOpts: Record<string, any> = {
  success: {
    status: 'Success',
    color: 0x28a745,
  },
  failure: {
    status: 'Failure',
    color: 0xcb2431,
  },
  cancelled: {
    status: 'Cancelled',
    color: 0xdbab09,
  },
};

export const getInputs = (): TInputs => {
  const discord_webhook = getInput('discord_webhook').trim() || '';
  const slack_webhook = getInput('slack_webhook').trim() || '';
  const status = getInput('status').trim() || '';
  const title = getInput('title').trim() || '';
  const description = getInput('description').trim() || '';

  return { discord_webhook, slack_webhook, title, description, status };
};

export function getPayloadDiscord(inputs: Readonly<TInputs>): Object {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const { eventName, ref, workflow, actor, payload, serverUrl, runId } = ctx;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;

  logDebug(JSON.stringify(payload));

  const eventFieldTitle = `Event - ${eventName}`;
  const eventDetail = formatEvent(eventName, payload);

  let embed: { [key: string]: any } = {
    color: statusOpts[inputs.status as any].color,
  };

  embed.timestamp = new Date().toISOString();
  embed.title = inputs.title;

  // if (inputs.url) {
    // embed.url = 'URL'
  // }

  // if (inputs.image) {
  //     embed.image = {
  //         url: inputs.image
  //     }
  // }

  embed.title =
    statusOpts[inputs.status as any].status +
    (embed.title ? `: ${embed.title}` : '');

  if (inputs.description) embed.description = inputs.description;

  embed.fields = [
    {
      name: 'Repository',
      value: `[${owner}/${repo}](${repoURL})`,
      inline: true,
    },
    {
      name: 'Ref',
      value: ref,
      inline: true,
    },
    {
      name: eventFieldTitle,
      value: eventDetail,
      inline: false,
    },
    {
      name: 'Triggered by',
      value: actor,
      inline: true,
    },
    {
      name: 'Workflow',
      value: `[${workflow}](${workflowURL})`,
      inline: true,
    },
  ];

  let discord_payload: any = {
    embeds: [fitEmbed(embed)],
  };
  logDebug(`embed: ${JSON.stringify(embed)}`);

  // if (inputs.username) {
  //     discord_payload.username = inputs.username
  // }
  // if (inputs.avatar_url) {
  //     discord_payload.avatar_url = inputs.avatar_url
  // }
  // if (inputs.content) {
  //     discord_payload.content = fitContent(inputs.content)
  // }

  return discord_payload;
}

export function getPayloadSlack(inputs: Readonly<TInputs>): Object {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const { eventName, ref, workflow, actor, payload, serverUrl, runId } = ctx;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;

  const eventFieldTitle = `Event - ${eventName}`;
  const eventDetail = formatEventSlack(eventName, payload);

  const title =
    statusOpts[inputs.status as any].status +
    (inputs.title ? `: ${inputs.title}` : '');

    let description = '';

  if (inputs.description) description = inputs.description;

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${description ? `${description}\n` : ''}*Repository:* <${repoURL}|${owner}/${repo}>.\n*Ref:* ${ref}.\n*${eventFieldTitle}:* ${eventDetail}.\n*Triggered by:* ${actor}.\n*Workflow:* <${workflowURL}|${workflow}>`,
      },
    }
  ]

  const slack_payload = {
    username: title,
    blocks,
  };

  return slack_payload;
}
