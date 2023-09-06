import { logDebug } from '../logs';

type Formatter = (payload: any) => string;

const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
};

export function escapeMarkdownUrl(url: string) {
  return url.replace(/\./g, '\\\\\.');
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
  return `[\`${payload.head_commit.id.substring(0, 7)}\`](${
   escapeMarkdownUrl( payload.head_commit.url)
  }) ${escapeMarkdownUrl(payload.head_commit.message)}`;
}

function pullRequestFormatter(payload: any): string {
  return `[\`#${payload.pull_request.number}\`](${escapeMarkdownUrl(payload.pull_request.html_url)}) ${escapeMarkdownUrl(payload.pull_request.title)}`;
}

function releaseFormatter(payload: any): string {
  const { name, body } = payload.release;
  const nameText = name ? `**${name}**` : '';
  return `${nameText}${nameText && body ? '\n' : ''}${escapeMarkdownUrl(body) || ''}`;
}
