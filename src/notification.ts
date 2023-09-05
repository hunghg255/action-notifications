import { logError } from './logs';
import { TInputs } from './types';
import axios from 'axios';
import { getPayloadDiscord, getPayloadSlack } from './utils';

export class Notification {
  private inputs: TInputs;

  constructor(inputs: TInputs) {
    this.inputs = inputs;
  }

  sendDiscordNotification() {
    try {
      const payload = getPayloadDiscord(this.inputs);
      return axios.post(this.inputs.discord_webhook as string, payload);
    } catch (e: any) {
      if (e.response) {
        logError(
          `Webhook response: ${e.response.status}: ${JSON.stringify(
            e.response.data
          )}`
        );
      } else {
        logError(e);
      }
    }
  }

  sendSlackNotification() {
    try {
      // const payload = getPayloadSlack(this.inputs);
      const blocks = [];
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*11`,
        },
      });

    const payload = {
      username: 'Test',
      blocks,
    };
      return axios.post(this.inputs.slack_webhook as string, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
      });
    } catch (e: any) {
      if (e.response) {
        logError(
          `Webhook response: ${e.response.status}: ${JSON.stringify(
            e.response.data
          )}`
        );
      } else {
        logError(e);
      }
    }
  }
}
