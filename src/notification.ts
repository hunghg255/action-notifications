import { logError, logInfo } from './logs';
import { TInputs } from './types';
import axios from 'axios';
import {
  getPayloadDiscord,
  getPayloadGoogleChat,
  getPayloadMsTeams,
  getPayloadSlack,
  getPayloadTelegram,
} from './utils';
import { TELEGRAM_SEND_PHOTO_URL, TELEGRAM_SEND_MSG_URL } from './constants';

export class Notification {
  private inputs: TInputs;

  constructor(inputs: TInputs) {
    this.inputs = inputs;
  }

  async sendDiscordNotification() {
    try {
      const payload = await getPayloadDiscord(this.inputs);

      await axios.post(this.inputs.discord_webhook as string, payload);
      logInfo('Discord notification sent');
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

  async sendSlackNotification() {
    try {
      const payload = getPayloadSlack(this.inputs);

      await axios.post(this.inputs.slack_webhook as string, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logInfo('Slack notification sent');
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

  async sendTelegramNotification() {
    try {
      const payload = getPayloadTelegram(this.inputs);

      const url = this.inputs.qrcode
        ? TELEGRAM_SEND_PHOTO_URL(this.inputs.telegram_bot_token as string)
        : TELEGRAM_SEND_MSG_URL(this.inputs.telegram_bot_token as string);

      await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logInfo('Telegram notification sent');
    } catch (e: any) {
      if (e.response) {
        logError(
          `Webhook Telegram response: ${e.response.status}: ${JSON.stringify(
            e.response.data
          )}`
        );
      } else {
        logError(e);
      }
    }
  }

  async sendGoogleChatNotification() {
    try {
      const payload = getPayloadGoogleChat(this.inputs);

      await axios.post(this.inputs.google_chat_webhook as string, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logInfo('Google Chat notification sent');
    } catch (e: any) {
      if (e.response) {
        logError(
          `Webhook Google Chat response: ${e.response.status}: ${JSON.stringify(
            e.response.data
          )}`
        );
      } else {
        logError(e);
      }
    }
  }

  async sendMsTeamsNotification() {
    try {
      const payload = getPayloadMsTeams(this.inputs);

      await axios.post(this.inputs.ms_teams_webhook as string, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logInfo('MS Teams notification sent');
    } catch (e: any) {
      if (e.response) {
        logError(
          `Webhook MS teams response: ${e.response.status}: ${JSON.stringify(
            e.response.data
          )}`
        );
      } else {
        logError(e);
      }
    }
  }
}
