import { logDebug } from '../logs';

type Formatter = (payload: any) => string;

const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
};

export function formatEventSlack(event: string, payload: Object): string {
  logDebug(JSON.stringify(payload, null, 2));
  let msg: string = 'No further information';
  if (event in formatters) {
    try {
      return formatters[event](payload) || msg;
    } catch (e: any) {
      logDebug(`Failed to generate eventDetail for ${event}: ${e}\n${e.stack}`);
    }
  }

  return msg;
}

// https://docs.slack.dev/messaging/formatting-message-text#escaping
function escapeSlackText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function pushFormatter(payload: any): string {
  const message = payload.head_commit.message.split('\n')[0];
  return `<${payload.head_commit.url}|\`${payload.head_commit.id.substring(
    0,
    7
  )}\`> ${escapeSlackText(message)}`;
}

function pullRequestFormatter(payload: any): string {
  return `<${payload.pull_request.html_url}|#${payload.pull_request.number}> ${escapeSlackText(
    payload.pull_request.title
  )}`;
}

function releaseFormatter(payload: any): string {
  const { name, body } = payload.release;
  const nameText = name ? `*${escapeSlackText(name)}*` : '';
  return `${nameText}${nameText && body ? '\n' : ''}${escapeSlackText(body || '')}`;
}
