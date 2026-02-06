import { Probot } from 'probot';
import handlers from './handlers.js';

console.log('APP_ID:', process.env.APP_ID);
console.log('PRIVATE_KEY length:', process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : 'undefined');
console.log('WEBHOOK_SECRET length:', process.env.WEBHOOK_SECRET ? process.env.WEBHOOK_SECRET.length : 'undefined');

if (!process.env.APP_ID || !process.env.PRIVATE_KEY || !process.env.WEBHOOK_SECRET) {
  throw new Error('Missing required environment variables: APP_ID, PRIVATE_KEY, WEBHOOK_SECRET');
}

let probot;
try {
  probot = new Probot({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    secret: process.env.WEBHOOK_SECRET,
  });
} catch (error) {
  throw new Error('Failed to create Probot instance: ' + error.message);
}

if (!probot || !probot.server) {
  throw new Error('Probot instance or server not created properly');
}

handlers(probot);

// Add a simple health check route
probot.server.get('/', (req, res) => {
  res.send('GitHub App is running and ready to receive webhooks.');
});

export default probot.server;