const { Probot } = require('probot');

const probot = new Probot();

require('./handlers')(probot);

module.exports = probot.server;