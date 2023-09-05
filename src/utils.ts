import { getInput } from '@actions/core';
import { TInputs } from './types';


export const getInputs = (): TInputs => {
    const discord_webhook = getInput('discord_webhook').trim() || '';
    const slack_webhook = getInput('slack_webhook').trim() || '';

    return { discord_webhook, slack_webhook };
}
