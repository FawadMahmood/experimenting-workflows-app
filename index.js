import { Probot } from 'probot';
import handlers from './handlers.js';

const probot = new Probot();

handlers(probot);

// Add a simple health check route
probot.server.get('/', (req, res) => {
  res.send('GitHub App is running and ready to receive webhooks.');
});

export default probot.server;