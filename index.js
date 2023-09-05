const axios = require('axios');

const blocks = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Repository: <https://a.com|Link>.\nRef: 22.`,
    },
  }
]

const slack_payload = {
  username: 'Success',
  blocks,
};
axios.post('https://hooks.slack.com/services/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', slack_payload, {
  headers: {
    'Content-Type': 'application/json'
  },
});

