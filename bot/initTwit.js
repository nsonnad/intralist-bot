// Initialize connection to twitter api

var index = require('../index');
var Twit = require('twit');

var config = index.config;
var log = index.log;

var T = new Twit(config.twitterApi);
log.info('twitter', 'initalized connection to twitter');

module.exports = T;
