import { App } from 'octokit';
import { createNodeMiddleware } from '@octokit/webhooks';
import { registerWebhookHandlers } from './webhookHandlers.js';

const appId: string = process.env.APP_ID || '';
const privateKey: string = process.env.PRIVATE_KEY || '';
const secret: string = process.env.WEBHOOK_SECRET || '';

const app = new App({
  appId,
  privateKey,
  webhooks: { secret }
});

registerWebhookHandlers(app);

const middleware = createNodeMiddleware(app.webhooks);

export default function handler(req: any, res: any): any {
  return middleware(req, res);
}
