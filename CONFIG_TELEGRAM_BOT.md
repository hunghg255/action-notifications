1. [Create a bot](https://core.telegram.org/bots#6-botfather)
2. Get the bot's API token from [@BotFather](https://telegram.me/BotFather)
3. Create a Group
4. Create a Chat channel
5. Edit Chat channel Link to a Group
6. Get the ID of the chat
    - Goto https://api.telegram.org/bot[BOT_TOKEN]/getUpdates

7. Test send a message using the HTTP API: https://core.telegram.org/bots/api#sendmessage

```shell
curl -X POST \
        -H 'Content-Type: application/json' \
        -d '{"chat_id": "123456789", "text": "This is a test from curl", "disable_notification": true}' \
        https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage
```
