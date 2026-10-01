import { describe, expect, it } from 'vitest';
import { formatEvent } from '../src/discord/format';
import { formatEventSlack } from '../src/slack/format';
import { escapeHtml, formatEventTelegram } from '../src/telegram/format';
import { formatEventGoogleChat } from '../src/google-chat/format';

const pushPayload = {
  head_commit: {
    id: '1234567890abcdef',
    url: 'https://github.com/example/repo/commit/1234567',
    message: 'Ship notifications\n\nwith a longer body',
  },
};

const prPayload = {
  pull_request: {
    number: 42,
    html_url: 'https://github.com/example/repo/pull/42',
    title: 'Improve payload formatting',
  },
};

describe('event formatters', () => {
  it('formats push payload for Discord', () => {
    expect(formatEvent('push', pushPayload)).toContain('Ship notifications');
    expect(formatEvent('push', pushPayload)).toContain('1234567');
  });

  it('uses only the first line of the commit message', () => {
    expect(formatEvent('push', pushPayload)).not.toContain('longer body');
    expect(formatEventSlack('push', pushPayload)).not.toContain('longer body');
    expect(formatEventTelegram('push', pushPayload)).not.toContain(
      'longer body'
    );
  });

  it('formats pull request payload for Slack', () => {
    const formatted = formatEventSlack('pull_request', prPayload);
    expect(formatted).toContain('42');
    expect(formatted).toContain('Improve payload formatting');
  });

  it('escapes HTML correctly for Telegram', () => {
    expect(escapeHtml('a <b> & c')).toBe('a &lt;b&gt; &amp; c');
  });

  it('formats push payload for Telegram as HTML', () => {
    const formatted = formatEventTelegram('push', pushPayload);
    expect(formatted).toContain('Ship notifications');
    expect(formatted).toContain('1234567');
    expect(formatted).toContain('<a href=');
  });

  it('escapes special characters in Slack text', () => {
    const payload = {
      head_commit: {
        id: '1234567890abcdef',
        url: 'https://github.com/example/repo/commit/1234567',
        message: 'fix <bug> & stuff',
      },
    };
    const formatted = formatEventSlack('push', payload);
    expect(formatted).toContain('fix &lt;bug&gt; &amp; stuff');
  });

  it('formats push payload for Google Chat', () => {
    const formatted = formatEventGoogleChat('push', pushPayload);
    expect(formatted.text).toContain('Ship notifications');
    expect(formatted.url).toBe(pushPayload.head_commit.url);
  });

  it('returns fallback for unknown events', () => {
    expect(formatEvent('workflow_dispatch', {})).toBe('No further information');
    expect(formatEventSlack('workflow_dispatch', {})).toBe(
      'No further information'
    );
    expect(formatEventTelegram('workflow_dispatch', {})).toBe(
      'No further information'
    );

    const googleChatFallback = formatEventGoogleChat('workflow_dispatch', {});
    expect(googleChatFallback).toEqual({ text: 'No further information', url: '' });
  });
});
