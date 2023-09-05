import { logError } from './logs';
import { TInputs } from './types';
import axios from 'axios';
import { getPayloadDiscord } from './utils';

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
    console.log('Sending Slack notification');
    // console.log(this.inputs);
  }
}
