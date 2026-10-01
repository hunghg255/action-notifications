import { getInput } from '@actions/core';
import { TInputs } from './types';
import * as github from '@actions/github';
import { logDebug } from './logs';
import { formatEvent } from './discord/format';
import { fitEmbed } from './validate';
import { formatEventSlack } from './slack/format';
import { formatEventTelegram, escapeHtml } from './telegram/format';
import { formatEventGoogleChat } from './google-chat/format';

export const statusOpts: Record<string, any> = {
  success: {
    status: 'Success',
    emoji: '✅',
    color: 0x28a745,
    color_hex: '#28a745',
  },
  failure: {
    status: 'Failure',
    emoji: '❌',
    color: 0xcb2431,
    color_hex: '#cb2431',
  },
  cancelled: {
    status: 'Cancelled',
    emoji: '⚠️',
    color: 0xdbab09,
    color_hex: '#dbab09',
  },
};

export function getStatusOpt(status?: string) {
  return (
    statusOpts[(status || '').toLowerCase()] || {
      status: status || 'Unknown',
      emoji: 'ℹ️',
      color: 0x768390,
      color_hex: '#768390',
    }
  );
}

export function getActionCtx() {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const { eventName, workflow, actor, payload, serverUrl, runId, sha } = ctx;
  const ref = ctx.ref || '';
  const runNumber = (ctx as any).runNumber ?? process.env.GITHUB_RUN_NUMBER ?? '';

  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;
  const commitURL = `${repoURL}/commit/${sha}`;
  const shortSha = (sha || '').substring(0, 7);
  const actorURL = `${serverUrl}/${actor}`;
  const actorAvatarURL = `${serverUrl}/${actor}.png?size=64`;

  const isTag = ref.startsWith('refs/tags/');
  let branch = ref.replace(/^refs\/(heads|tags)\//, '');
  let refLabel = isTag ? 'Tag' : 'Branch';
  if (
    (eventName === 'pull_request' || eventName === 'pull_request_target') &&
    payload?.pull_request?.head?.ref
  ) {
    branch = payload.pull_request.head.ref;
    refLabel = 'Branch';
  }
  const branchURL = isTag
    ? `${repoURL}/releases/tag/${branch}`
    : `${repoURL}/tree/${branch}`;

  return {
    owner,
    repo,
    eventName,
    ref,
    workflow,
    actor,
    payload,
    serverUrl,
    runId,
    runNumber,
    sha,
    repoURL,
    workflowURL,
    commitURL,
    shortSha,
    actorURL,
    actorAvatarURL,
    branch,
    branchURL,
    refLabel,
  };
}

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
  const telegram_message_thread_id = getInput('telegram_message_thread_id').trim() || '';
  const google_chat_webhook = getInput('google_chat_webhook').trim() || '';
  const ms_teams_webhook = getInput('ms_teams_webhook').trim() || '';
  const status = getInput('status').trim() || '';
  const title = getInput('title').trim() || '';
  const description = getInput('description').trim() || '';
  const qrcode = getInput('qrcode').trim() || '';

  return {
    discord_webhook,
    slack_webhook,
    slack_username,
    telegram_bot_token,
    telegram_chat_id,
    telegram_message_thread_id,
    google_chat_webhook,
    ms_teams_webhook,
    title,
    description,
    status,
    qrcode,
  };
};

export async function getPayloadDiscord(inputs: Readonly<TInputs>) {
  const {
    owner,
    repo,
    eventName,
    workflow,
    actor,
    payload,
    runNumber,
    repoURL,
    workflowURL,
    commitURL,
    shortSha,
    actorURL,
    actorAvatarURL,
    branch,
    branchURL,
    refLabel,
  } = getActionCtx();

  logDebug(JSON.stringify(payload));

  const statusOpt = getStatusOpt(inputs.status);
  const eventDetail = formatEvent(eventName, payload);

  const embed: { [key: string]: any } = {
    color: statusOpt.color,
    timestamp: new Date().toISOString(),
    title: `${statusOpt.emoji} ${statusOpt.status}${inputs.title ? `: ${inputs.title}` : ''}`,
    url: workflowURL,
    author: {
      name: actor,
      url: actorURL,
      icon_url: actorAvatarURL,
    },
    footer: {
      text: `${workflow} #${runNumber}`,
    },
  };

  if (inputs.description) embed.description = inputs.description;

  embed.fields = [
    {
      name: 'Repository',
      value: `[${owner}/${repo}](${repoURL})`,
      inline: true,
    },
    {
      name: refLabel,
      value: `[\`${branch}\`](${branchURL})`,
      inline: true,
    },
    {
      name: 'Commit',
      value: shortSha ? `[\`${shortSha}\`](${commitURL})` : '—',
      inline: true,
    },
    {
      name: `Event — ${eventName}`,
      value: eventDetail,
      inline: false,
    },
    {
      name: 'Workflow',
      value: `[${workflow} #${runNumber}](${workflowURL})`,
      inline: true,
    },
    {
      name: 'Triggered by',
      value: `[${actor}](${actorURL})`,
      inline: true,
    },
  ];

  if (inputs.qrcode) {
    embed.thumbnail = {
      url: `https://avatar1.vercel.app/qr/${encodeURIComponent(inputs.qrcode)}`,
    };
  }

  const discord_payload: any = {
    embeds: [fitEmbed(embed)],
  };

  logDebug(`embed: ${JSON.stringify(embed)}`);

  return discord_payload;
}

function escapeSlack(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getPayloadSlack(inputs: Readonly<TInputs>): Object {
  const {
    owner,
    repo,
    eventName,
    workflow,
    actor,
    payload,
    runNumber,
    repoURL,
    workflowURL,
    commitURL,
    shortSha,
    actorURL,
    branch,
    branchURL,
    refLabel,
  } = getActionCtx();

  const statusOpt = getStatusOpt(inputs.status);
  const eventDetail = formatEventSlack(eventName, payload);

  const title = `${statusOpt.status}${inputs.title ? `: ${escapeSlack(inputs.title)}` : ''}`;

  let headline = `${statusOpt.emoji} *<${workflowURL}|${title}>*`;
  if (inputs.description) headline += `\n${escapeSlack(inputs.description)}`;

  const blocks: any[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: headline },
    },
    {
      type: 'section',
      fields: [
        `*Repository:*\n<${repoURL}|${owner}/${repo}>`,
        `*${refLabel}:*\n<${branchURL}|\`${branch}\`>`,
        `*Commit:*\n${shortSha ? `<${commitURL}|\`${shortSha}\`>` : '—'}`,
        `*Triggered by:*\n<${actorURL}|${actor}>`,
      ].map((text) => ({ type: 'mrkdwn', text })),
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Event — ${eventName}:*\n${eventDetail}`,
      },
    },
  ];

  if (inputs.qrcode) {
    blocks.push({
      type: 'image',
      image_url: `https://avatar1.vercel.app/qr/${encodeURIComponent(inputs.qrcode)}`,
      alt_text: 'QR code',
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `⚙️ <${workflowURL}|${workflow} #${runNumber}> • <!date^${Math.floor(
          Date.now() / 1000
        )}^{date_short_pretty} {time}|${new Date().toISOString()}>`,
      },
    ],
  });

  const slack_payload: any = {
    username: inputs.slack_username || 'Notifications',
    attachments: [
      {
        color: statusOpt.color_hex,
        fallback: `${statusOpt.emoji} ${title} — ${owner}/${repo} (${branch})`,
        blocks,
      },
    ],
  };

  return slack_payload;
}

export function getPayloadTelegram(inputs: Readonly<TInputs>): Object {
  const {
    owner,
    repo,
    eventName,
    workflow,
    actor,
    payload,
    runNumber,
    repoURL,
    workflowURL,
    commitURL,
    shortSha,
    actorURL,
    branch,
    refLabel,
  } = getActionCtx();

  logDebug(JSON.stringify(payload));

  const statusOpt = getStatusOpt(inputs.status);
  const eventDetail = formatEventTelegram(eventName, payload);

  const title = `${statusOpt.status}${inputs.title ? `: ${inputs.title}` : ''}`;

  const lines: string[] = [
    `${statusOpt.emoji} <b>${escapeHtml(title)}</b>`,
  ];

  if (inputs.description) {
    lines.push('', escapeHtml(inputs.description));
  }

  lines.push(
    '',
    `📦 <b>Repository:</b> <a href="${repoURL}">${escapeHtml(`${owner}/${repo}`)}</a>`,
    `🌿 <b>${refLabel}:</b> <code>${escapeHtml(branch)}</code>`,
    `🔖 <b>Commit:</b> ${shortSha ? `<a href="${commitURL}"><code>${shortSha}</code></a>` : '—'}`,
    `📣 <b>Event — ${escapeHtml(eventName)}:</b> ${eventDetail}`,
    `👤 <b>Triggered by:</b> <a href="${actorURL}">${escapeHtml(actor)}</a>`,
    `⚙️ <b>Workflow:</b> <a href="${workflowURL}">${escapeHtml(workflow)} #${runNumber}</a>`
  );

  const text = lines.join('\n');

  let telegram_payload: any = {
    chat_id: inputs.telegram_chat_id,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  if (inputs.qrcode) {
    // Telegram photo captions are limited to 1024 characters
    telegram_payload.caption = text.length > 1024 ? `${text.slice(0, 1021)}...` : text;
    telegram_payload.photo = `https://avatar1.vercel.app/qr/${encodeURIComponent(inputs.qrcode)}`;
    delete telegram_payload.text;
    delete telegram_payload.disable_web_page_preview;
  }

  if (inputs.telegram_message_thread_id) {
    telegram_payload = {
      ...telegram_payload,
      message_thread_id: inputs.telegram_message_thread_id,
    };
  }

  return telegram_payload;
}

export function getPayloadGoogleChat(inputs: Readonly<TInputs>): Object {
  const {
    owner,
    repo,
    eventName,
    workflow,
    actor,
    payload,
    runNumber,
    repoURL,
    workflowURL,
    commitURL,
    shortSha,
    branch,
    refLabel,
  } = getActionCtx();

  logDebug(JSON.stringify(payload));

  const statusOpt = getStatusOpt(inputs.status);
  const eventDetail = formatEventGoogleChat(eventName, payload);

  const title = `${statusOpt.emoji} ${statusOpt.status}${inputs.title ? `: ${inputs.title}` : ''}`;

  const payload_gg = {
    cards: [
      {
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `<b><font color="${statusOpt.color_hex}">${title}</font></b>`,
                },
              },
              {
                textParagraph: {
                  text: inputs.description || '',
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
                keyValue: { topLabel: refLabel, content: branch },
              },
              {
                keyValue: {
                  topLabel: 'Commit',
                  content: shortSha || '—',
                  button: textButton('Open Commit', commitURL),
                },
              },
              {
                keyValue: {
                  topLabel: `Event — ${eventName}`,
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
                  content: `${workflow} #${runNumber}`,
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
  const {
    owner,
    repo,
    eventName,
    workflow,
    actor,
    payload,
    runNumber,
    repoURL,
    workflowURL,
    commitURL,
    shortSha,
    branch,
    refLabel,
  } = getActionCtx();

  logDebug(JSON.stringify(payload));

  const statusOpt = getStatusOpt(inputs.status);
  const eventDetail = formatEvent(eventName, payload);

  const title = `${statusOpt.emoji} ${statusOpt.status}${inputs.title ? `: ${inputs.title}` : ''}`;

  const facts = [
    `<strong>Repository:</strong> [${owner}/${repo}](${repoURL})`,
    `<strong>${refLabel}:</strong> \`${branch}\``,
    `<strong>Commit:</strong> ${shortSha ? `[\`${shortSha}\`](${commitURL})` : '—'}`,
    `<strong>Event — ${eventName}:</strong> ${eventDetail}`,
    `<strong>Triggered by:</strong> ${actor}`,
    `<strong>Workflow:</strong> [${workflow} #${runNumber}](${workflowURL})`,
  ];

  const payload_ms_teams = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.teams.card.o365connector',
        content: {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: title,
          themeColor: statusOpt.color_hex,
          title,
          sections: [
            {
              text: inputs.description || '',
              wrap: true,
            },
            {
              text: facts.join('<br />'),
              wrap: true,
            },
          ],
        },
      },
    ],
  };

  return payload_ms_teams;
}
