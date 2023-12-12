import { getInput } from '@actions/core';
import { TInputs } from './types';
import * as github from '@actions/github';
import { logDebug } from './logs';
import { formatEvent } from './discord/format';
import { fitEmbed } from './validate';
import { formatEventSlack } from './slack/format';
import { formatEventTelegram, escapeMarkdownUrl } from './telegram/format';
import { formatEventGoogleChat } from './google-chat/format';
import FormData from 'form-data';
import { renderBase64 } from 'hqr';

export const statusOpts: Record<string, any> = {
  success: {
    status: 'Success',
    color: 0x28a745,
    color_hex: '#28a745',
  },
  failure: {
    status: 'Failure',
    color: 0xcb2431,
    color_hex: '#cb2431',
  },
  cancelled: {
    status: 'Cancelled',
    color: 0xdbab09,
    color_hex: '#dbab09',
  },
};

const textButton = (text: string, url: string) => ({
  textButton: {
    text,
    onClick: { openLink: { url } },
  },
});

export const getInputs = (): TInputs => {
  const discord_webhook = getInput('discord_webhook').trim() || '';
  const slack_webhook = getInput('slack_webhook').trim() || '';
  const slack_username = getInput('slack_username').trim() || '';
  const telegram_bot_token = getInput('telegram_bot_token').trim() || '';
  const telegram_chat_id = getInput('telegram_chat_id').trim() || '';
  const google_chat_webhook = getInput('google_chat_webhook').trim() || '';
  const ms_teams_webhook = getInput('ms_teams_webhook').trim() || '';
  const status = getInput('status').trim() || '';
  const title = getInput('title').trim() || '';
  const description = getInput('description').trim() || '';
  const qrcode = getInput('qrcode').trim() || '';
  telegram_bot_token;

  return {
    discord_webhook,
    slack_webhook,
    slack_username,
    telegram_bot_token,
    telegram_chat_id,
    google_chat_webhook,
    ms_teams_webhook,
    title,
    description,
    status,
    qrcode,
  };
};

export async function getPayloadDiscord(inputs: Readonly<TInputs>) {
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

  if (inputs.qrcode) {
    embed.thumbnail = {
      url: 'attachment://actionqrcode.png',
    };
  }

  const form = new FormData();

  if (inputs.qrcode && typeof inputs.qrcode === 'string') {
    const r = await renderBase64(inputs.qrcode) as string;

    form.append(
      'file[0]',
      Buffer.from(r.replace('data:image/png;base64,', ''), 'base64'),
      'actionqrcode.png'
    );
  }

  form.append(
    'payload_json',
    JSON.stringify({
      embeds: [fitEmbed(embed)],
    })
  );

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

  return form;
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

  const slack_payload = {
    username: inputs.slack_username || 'Notifications',
    attachments: [
      {
        mrkdwn_in: ['text'],
        color: statusOpts[inputs.status as any].color_hex,
        title: title,
        text: description,
        fields: [
          {
            title: 'Repository',
            value: `<${repoURL}|${owner}/${repo}>`,
            short: true,
          },
          {
            title: 'Ref',
            value: ref,
            short: true,
          },
          {
            title: eventFieldTitle,
            value: eventDetail,
            short: false,
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

  if (inputs.telegram_message_thread_id) {
    telegram_payload.message_thread_id = inputs.telegram_message_thread_id;
  }

  return telegram_payload;
}

export function getPayloadGoogleChat(inputs: Readonly<TInputs>): Object {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const { eventName, ref, workflow, actor, payload, serverUrl, runId } = ctx;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;

  logDebug(JSON.stringify(payload));

  const eventFieldTitle = `Event - ${eventName}`;
  const eventDetail = formatEventGoogleChat(eventName, payload);

  let embed: { [key: string]: any } = {
    color: statusOpts[inputs.status as any].color_hex,
  };

  embed.timestamp = new Date().toISOString();
  embed.title = inputs.title;

  embed.title =
    statusOpts[inputs.status as any].status +
    (embed.title ? `: ${embed.title}` : '');

  if (inputs.description) embed.description = inputs.description;

  const payload_gg = {
    cards: [
      {
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `<b><font color="${embed.color}">${embed.title}</font></b>`,
                },
              },
              {
                textParagraph: {
                  text: embed.description,
                },
              },
            ],
          },
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Repository',
                  content: `${owner}/${repo}`,
                  contentMultiline: true,
                  button: textButton('Open Repository', repoURL),
                },
              },
              {
                keyValue: { topLabel: 'ref', content: ref },
              },
              {
                keyValue: {
                  topLabel: eventFieldTitle,
                  content: eventDetail.text,
                  contentMultiline: true,
                  button: textButton('Open Event', eventDetail.url || repoURL),
                },
              },
              {
                keyValue: { topLabel: 'Triggered by', content: actor },
              },
              {
                keyValue: {
                  topLabel: 'Workflow',
                  content: workflow,
                  contentMultiline: true,
                  button: textButton('Open Workflow', workflowURL),
                },
              },
            ],
          },
        ],
      },
    ],
  };

  return payload_gg;
}

export function getPayloadMsTeams(inputs: Readonly<TInputs>): Object {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const { eventName, ref, workflow, actor, payload, serverUrl, runId } = ctx;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;

  logDebug(JSON.stringify(payload));

  const eventFieldTitle = `Event - ${eventName}`;
  const eventDetail = formatEvent(eventName, payload);

  let embed: { [key: string]: any } = {
    color: statusOpts[inputs.status as any].color_hex,
  };

  embed.timestamp = new Date().toISOString();
  embed.title = inputs.title;

  embed.title =
    statusOpts[inputs.status as any].status +
    (embed.title ? `: ${embed.title}` : '');

  if (inputs.description) embed.description = inputs.description;

  const payload_ms_teams = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.teams.card.o365connector',
        content: {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: 'Summary',
          themeColor: embed.color,
          title: embed.title,
          sections: [
            {
              text: embed.description,
              wrap: true,
            },
            {
              text: `<strong>Repository:</strong> [${owner}/${repo}](${repoURL})<br /><strong>Ref:</strong> ${ref}<br/><strong>${eventFieldTitle}:</strong> ${eventDetail}<br/><strong>Triggered by:</strong> ${actor}<br /><strong>Workflow:</strong> [${workflow}](${workflowURL})`,
              wrap: true,
            },
          ],
        },
      },
    ],
  };

  return payload_ms_teams;
}
