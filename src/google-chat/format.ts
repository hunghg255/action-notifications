import { logDebug } from '../logs';

type Formatter = (payload: any) => any;

const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
};

export function formatEventGoogleChat(event: string, payload: Object): any {
  logDebug(JSON.stringify(payload, null, 2));
  let msg: string = 'No further information';
  if (event in formatters) {
    try {
      return formatters[event](payload) || msg;
    } catch (e: any) {
      logDebug(`Failed to generate eventDetail for ${event}: ${e}\n${e.stack}`);
      return {
        text: msg,
        url: ''
      };
    }
  }

  return {
    text: msg,
    url: ''
  };
}

function pushFormatter(payload: any): any {
  return {
    text: `\`${payload.head_commit.id.substring(0, 7)}\` ${payload.head_commit.message}`,
    url: payload.head_commit.url,
  }
}

function pullRequestFormatter(payload: any): any {
  return {
    text: `\`#${payload.pull_request.number}\` ${payload.pull_request.title}`,
    url: payload.pull_request.html_url,
  }
}

function releaseFormatter(payload: any): any {
  const { name, body } = payload.release;
  const nameText = name ? `**${name}**` : '';

  return {
    text: `${nameText}${nameText && body ? '\n' : ''}${body || ''}`,
    url: '',
  }
}
