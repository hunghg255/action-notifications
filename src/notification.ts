import { logError } from './logs';
import { TInputs } from './types';
import axios from 'axios';
import { getPayloadDiscord, getPayloadSlack } from './utils';
import { setFailed } from '@actions/core';

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
      const payload = getPayloadSlack(this.inputs);

      return axios.post(this.inputs.slack_webhook as string, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
      });
    } catch (e: any) {
      setFailed('ERROR');

      // if (e.response) {
      //   logError(
      //     `Webhook response: ${e.response.status}: ${JSON.stringify(
      //       e.response.data
      //     )}`
      //   );
      // } else {
      //   logError(e);
      // }
    }
  }
}
