import { App } from 'octokit';
import { createNodeMiddleware } from '@octokit/webhooks';
import { registerWebhookHandlers } from './webhookHandlers.js';

const appId = process.env.APP_ID;
const privateKey = process.env.PRIVATE_KEY;
const secret = process.env.WEBHOOK_SECRET;

const app = new App({
  appId,
  privateKey,
  webhooks: { secret }
});

registerWebhookHandlers(app);

const middleware = createNodeMiddleware(app.webhooks);

export default function handler(req, res) {
  return middleware(req, res);
}