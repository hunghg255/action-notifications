import { getInput } from '@actions/core';
import { TInputs } from './types';
import * as github from '@actions/github';
import { logDebug } from './logs';
import { formatEvent } from './discord/format';
import { fitEmbed } from './validate';
import { formatEventSlack } from './slack/format';
import { formatEventTelegram, escapeMarkdownUrl } from './telegram/format';

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
  const telegram_bot_token = getInput('telegram_bot_token').trim() || '';
  const telegram_chat_id = getInput('telegram_chat_id').trim() || '';
  const status = getInput('status').trim() || '';
  const title = getInput('title').trim() || '';
  const description = getInput('description').trim() || '';
  telegram_bot_token;

  return {
    discord_webhook,
    slack_webhook,
    telegram_bot_token,
    telegram_chat_id,
    title,
    description,
    status,
  };
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
  const timestamp = new Date().getTime();

  let description = '';

  if (inputs.description) description = inputs.description;

  // const blocks = [
  //   {
  //     type: 'section',
  //     text: {
  //       type: 'mrkdwn',
  //       text: `${
  //         description ? `${description}\n` : ''
  //       }*Repository:* <${repoURL}|${owner}/${repo}>.\n*Ref:* ${ref}.\n*${eventFieldTitle}:* ${eventDetail}.\n*Triggered by:* ${actor}.\n*Workflow:* <${workflowURL}|${workflow}>`,
  //     },
  //   },
  // ];

  const slack_payload = {
    username: title,
    // blocks,
    attachments: [
      {
        mrkdwn_in: ['text'],
        color: statusOpts[inputs.status as any].color,
        pretext: description,
        fields: [
          {
            title: "Repository",
            value: `<${repoURL}|${owner}/${repo}>`,
            short: true,
          },
          {
            title: "Ref",
            value: ref,
            short: true,
          },
          {
            title: eventFieldTitle,
            value: eventDetail,
            short: true,
          },
          {
            title: 'Triggered by',
            value: actor,
            short: true,
          },
          {
            title: 'Workflow',
            value: `<${workflowURL}|${workflow}>`,
            short: true,
          },
        ],
        ts: timestamp,
      },
    ],
  };

  return slack_payload;
}

export function getPayloadTelegram(inputs: Readonly<TInputs>): Object {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const { eventName, ref, workflow, actor, payload, serverUrl, runId } = ctx;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;

  logDebug(JSON.stringify(payload));

  const eventFieldTitle = `Event \\- ${eventName}`;
  const eventDetail = formatEventTelegram(eventName, payload);

  const title =
    statusOpts[inputs.status as any].status +
    (inputs.title ? `: ${inputs.title}` : '');

  let description = '';

  if (inputs.description) description = inputs.description;

  let telegram_payload: any = {
    chat_id: inputs.telegram_chat_id,
    text: `${`*${escapeMarkdownUrl(title)}*\n${escapeMarkdownUrl(
      description
    )}\n*Repository:* [${owner}/${escapeMarkdownUrl(repo)}](${escapeMarkdownUrl(
      repoURL
    )})\n*Ref:* ${ref}\n*${eventFieldTitle}:* ${eventDetail}\n*Triggered by:* ${actor}\n*Workflow:* [${escapeMarkdownUrl(
      workflow
    )}](${escapeMarkdownUrl(workflowURL)})`}`,
    parse_mode: 'MarkdownV2',
  };

  return telegram_payload;
}
