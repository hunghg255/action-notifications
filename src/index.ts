import { setFailed } from '@actions/core'
import { getInputs } from './utils';
import { Notification } from './notification';

function main() {
  try {
    const inputs = getInputs();

    const notification = new Notification(inputs);

    if (!inputs.discord_webhook && !inputs.slack_webhook && !inputs.telegram_bot_token && !inputs.google_chat_webhook && !inputs.ms_teams_webhook) {
      setFailed('You must provide at least one webhook.')
    }

    if (inputs.discord_webhook) {
      notification.sendDiscordNotification();
    }

    if (inputs.slack_webhook) {
      notification.sendSlackNotification();
    }

    if (inputs.telegram_bot_token) {
      if (!inputs.telegram_chat_id) {
        setFailed('You must provide a telegram chat id.')
      }

      if (inputs.telegram_chat_id) {
        notification.sendTelegramNotification();
      }
    }

    if (inputs.google_chat_webhook) {
      notification.sendGoogleChatNotification();
    }

    if (inputs.ms_teams_webhook) {
      notification.sendMsTeamsNotification();
    }

  } catch (error: any) {
    setFailed(error.message)
  }
}

main()
