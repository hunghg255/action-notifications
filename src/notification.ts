import { TInputs } from "./types";

export class Notification {
  private inputs: TInputs;

  constructor(inputs: TInputs) {
    this.inputs = inputs;
  }

  sendDiscordNotification() {
    console.log('Sending Discord notification');
    console.log(this.inputs);
  }

  sendSlackNotification() {
    console.log('Sending Slack notification');
    console.log(this.inputs);
  }
}
