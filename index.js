import { App } from 'octokit';
import { createNodeMiddleware } from '@octokit/webhooks';

const appId = process.env.APP_ID;
const privateKey = process.env.PRIVATE_KEY;
const secret = process.env.WEBHOOK_SECRET;

if (!process.env.APP_ID || !process.env.PRIVATE_KEY || !process.env.WEBHOOK_SECRET) {
  throw new Error('Missing required environment variables: APP_ID, PRIVATE_KEY, WEBHOOK_SECRET');
}

app.webhooks.on('pull_request.opened', async ({ octokit, payload }) => {
  try {
    await octokit.rest.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: '🤖 Workflow run started for PR.'
    });
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`);
    } else {
      console.error(error);
    }
  }
});

app.webhooks.onError((error) => {
  if (error.name === 'AggregateError') {
    console.log(`Error processing request: ${error.event}`);
  } else {
    console.log(error);
  }
});

const middleware = createNodeMiddleware(app.webhooks);

export default function handler(req, res) {
  return middleware(req, res);
}