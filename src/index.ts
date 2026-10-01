import { setFailed } from '@actions/core'
import { getInputs } from './utils';
import { Notification } from './notification';

async function main() {
  try {
    const inputs = getInputs();

    const notification = new Notification(inputs);

    if (!inputs.discord_webhook && !inputs.slack_webhook && !inputs.telegram_bot_token && !inputs.google_chat_webhook && !inputs.ms_teams_webhook) {
      setFailed('You must provide at least one webhook.')
    }

    const jobs: Promise<void>[] = [];

    if (inputs.discord_webhook) {
      jobs.push(notification.sendDiscordNotification());
    }

    if (inputs.slack_webhook) {
      jobs.push(notification.sendSlackNotification());
    }

    if (inputs.telegram_bot_token) {
      if (!inputs.telegram_chat_id) {
        setFailed('You must provide a telegram chat id.')
      }

      if (inputs.telegram_chat_id) {
        jobs.push(notification.sendTelegramNotification());
      }
    }

    if (inputs.google_chat_webhook) {
      jobs.push(notification.sendGoogleChatNotification());
    }

    if (inputs.ms_teams_webhook) {
      jobs.push(notification.sendMsTeamsNotification());
    }

    await Promise.all(jobs);
  } catch (error: any) {
    setFailed(error.message)
  }
}

main()
