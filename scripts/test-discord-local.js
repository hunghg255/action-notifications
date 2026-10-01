#!/usr/bin/env node

/**
 * Local Discord notification test script
 * Usage: node scripts/test-discord-local.js <webhook_url> [title] [description]
 *
 * Example:
 *   node scripts/test-discord-local.js "https://discord.com/api/webhooks/..." "Test Title" "Test Description"
 */

const axios = require('axios');

// Mock GitHub context
const mockGitHubContext = {
  repo: {
    owner: 'test-user',
    repo: 'action-notifications',
  },
  eventName: 'push',
  ref: 'refs/heads/main',
  workflow: 'Local Test',
  actor: 'test-actor',
  payload: {
    head_commit: {
      id: 'abc1234567890def',
      url: 'https://github.com/test-user/action-notifications/commit/abc1234',
      message: 'Test commit from local script',
    },
  },
  serverUrl: 'https://github.com',
  runId: 0,
  runNumber: 1,
  sha: 'abc1234567890def',
};

// Parse command-line arguments
const webhookUrl = process.argv[2];
const title = process.argv[3] || 'Local Test Notification';
const description = process.argv[4] || 'Testing Discord notification from local script';

if (!webhookUrl) {
  console.error('❌ Error: Discord webhook URL is required');
  console.error('Usage: node scripts/test-discord-local.js <webhook_url> [title] [description]');
  process.exit(1);
}

// Validate webhook URL format
if (!webhookUrl.includes('discord.com/api/webhooks')) {
  console.error('❌ Error: Invalid Discord webhook URL');
  console.error('Expected format: https://discord.com/api/webhooks/...');
  process.exit(1);
}

console.log('🚀 Testing Discord notification locally...');
console.log(`📝 Title: ${title}`);
console.log(`📝 Description: ${description}`);
console.log('');

// Status options matching src/utils.ts
const statusOpts = {
  success: { status: 'Success', emoji: '✅', color: 0x28a745 },
  failure: { status: 'Failure', emoji: '❌', color: 0xcb2431 },
  cancelled: { status: 'Cancelled', emoji: '⚠️', color: 0xdbab09 },
};

const status = 'success';

try {
  // Build payload matching the actual Discord formatter from src/utils.ts
  console.log('⚙️  Building Discord payload...');

  const { owner, repo } = mockGitHubContext.repo;
  const { serverUrl, actor, workflow, runId, runNumber, sha } = mockGitHubContext;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;
  const branch = mockGitHubContext.ref.replace(/^refs\/(heads|tags)\//, '');
  const shortSha = sha.substring(0, 7);
  const statusOpt = statusOpts[status] || statusOpts.success;

  const embed = {
    color: statusOpt.color,
    timestamp: new Date().toISOString(),
    title: `${statusOpt.emoji} ${statusOpt.status}: ${title}`,
    url: workflowURL,
    description: description,
    author: {
      name: actor,
      url: `${serverUrl}/${actor}`,
      icon_url: `${serverUrl}/${actor}.png?size=64`,
    },
    footer: {
      text: `${workflow} #${runNumber}`,
    },
    fields: [
      {
        name: 'Repository',
        value: `[${owner}/${repo}](${repoURL})`,
        inline: true,
      },
      {
        name: 'Branch',
        value: `[\`${branch}\`](${repoURL}/tree/${branch})`,
        inline: true,
      },
      {
        name: 'Commit',
        value: `[\`${shortSha}\`](${repoURL}/commit/${sha})`,
        inline: true,
      },
      {
        name: `Event — ${mockGitHubContext.eventName}`,
        value: `[\`${mockGitHubContext.payload.head_commit.id.substring(0, 7)}\`](${mockGitHubContext.payload.head_commit.url}) ${mockGitHubContext.payload.head_commit.message}`,
        inline: false,
      },
      {
        name: 'Workflow',
        value: `[${workflow} #${runNumber}](${workflowURL})`,
        inline: true,
      },
      {
        name: 'Triggered by',
        value: `[${actor}](${serverUrl}/${actor})`,
        inline: true,
      },
    ],
  };

  const payload = {
    embeds: [embed],
  };

  console.log('📦 Payload structure:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  // Send to Discord
  console.log('📤 Sending to Discord...');
  axios.post(webhookUrl, payload).then((response) => {
    console.log('✅ Success! Discord webhook returned status:', response.status);
    console.log('💬 Check your Discord channel for the notification.');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error sending to Discord:', error.response?.status, error.response?.data || error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
}
