import { logError, logInfo } from './logs';
import { TInputs } from './types';
import axios from 'axios';
import { getPayloadDiscord, getPayloadSlack, getPayloadTelegram } from './utils';
import { TELEGRAM_SEND_MSG_URL } from './constants';

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
          `Webhook Discord response: ${e.response.status}: ${JSON.stringify(
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
logInfo(JSON.stringify(payload, null, 2));
      return axios.post(this.inputs.slack_webhook as string,  payload, {
        headers: {
          'Content-Type': 'application/json'
        },
      });
    } catch (e: any) {
      if (e.response) {
        logError(
          `Webhook Slack response: ${e.response.status}: ${JSON.stringify(
            e.response.data
          )}`
        );
      } else {
        logError(e);
      }
    }
  }

  sendTelegramNotification() {
    try {
      const payload = getPayloadTelegram(this.inputs);


      return axios.post(TELEGRAM_SEND_MSG_URL(this.inputs.telegram_bot_token as string),  payload, {
        headers: {
          'Content-Type': 'application/json'
        },
      });
    } catch (e: any) {
      if (e.response) {
        logError(
          `Webhook Slack response: ${e.response.status}: ${JSON.stringify(
            e.response.data
          )}`
        );
      } else {
        logError(e);
      }
    }
  }
}
