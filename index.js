const { Probot } = require('probot');

const probot = new Probot();

require('./handlers')(probot);

// Add a simple health check route
probot.server.get('/', (req, res) => {
  res.send('GitHub App is running and ready to receive webhooks.');
});

module.exports = probot.server;