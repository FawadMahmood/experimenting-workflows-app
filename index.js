import { Probot } from 'probot';
import handlers from './handlers.js';

if (!process.env.APP_ID || !process.env.PRIVATE_KEY || !process.env.WEBHOOK_SECRET) {
  throw new Error('Missing required environment variables: APP_ID, PRIVATE_KEY, WEBHOOK_SECRET');
}

const probot = new Probot({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  secret: process.env.WEBHOOK_SECRET,
});

handlers(probot);

// Add a simple health check route
probot.server.get('/', (req, res) => {
  res.send('GitHub App is running and ready to receive webhooks.');
});

export default probot.server;