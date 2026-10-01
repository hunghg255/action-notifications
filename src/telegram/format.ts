import { logDebug } from '../logs';

type Formatter = (payload: any) => string;

const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
};

// https://core.telegram.org/bots/api#html-style
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatEventTelegram(event: string, payload: Object): string {
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

function pushFormatter(payload: any): string {
  const message = payload.head_commit.message.split('\n')[0];
  return `<a href="${payload.head_commit.url}"><code>${payload.head_commit.id.substring(
    0,
    7
  )}</code></a> ${escapeHtml(message)}`;
}

function pullRequestFormatter(payload: any): string {
  return `<a href="${payload.pull_request.html_url}">#${
    payload.pull_request.number
  }</a> ${escapeHtml(payload.pull_request.title)}`;
}

function releaseFormatter(payload: any): string {
  const { name, body } = payload.release;
  const nameText = name ? `<b>${escapeHtml(name)}</b>` : '';
  return `${nameText}${nameText && body ? '\n' : ''}${escapeHtml(body || '')}`;
}
