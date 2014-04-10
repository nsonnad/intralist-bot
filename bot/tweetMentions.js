#!/usr/bin/env node

// Find mutual mentions and retweet them

var _ = require('lodash');
var async = require('async');
var index = require('../index');
var T = require('./initTwit');

var log = index.log;
var botInfo = index.config.botInfo;
var listInfo = index.config.listInfo;
var db = index.db;

var dbScreenNames;

// Add api call params to bot and list info in config
_.assign(botInfo, {
  include_rts: 'true'
});

_.assign(listInfo, {
  include_rts: 'false',
  count: 200
});

// make array of recent RTs to make sure we dont RT twice
// maybe check the db for this ??
function getPastTweets (callback) {
  log.info('twitter', 'fetching past tweets');
  var pastBotTweets = [];

  T.get('statuses/user_timeline', botInfo, function (err, res) {
    _.each(res, function (resItem) {
      if (resItem.retweeted === true) {
        pastBotTweets.push(resItem.retweeted_status.id_str);
      }
    });
    log.info('twitter', 'past tweets fetched');
    callback(null, pastBotTweets);
  });
}

function findNewMentions (pastBotTweets, callback) {
  log.info('twitter', 'finding new mentions');
  var intersections = [];

  T.get('lists/statuses', listInfo, function (err, res) {
    _.each(res, function (resItem) {
      var mentions = resItem.entities.user_mentions;
      var mentionsScreenNames = _.pluck(mentions, 'screen_name');
      var onlyOwnScreenName = mentionsScreenNames.length == 1 && _.contains(mentionsScreenNames, resItem.user.screen_name);

      if (mentions.length > 0 && onlyOwnScreenName === false) {
        var intersect = _.intersection(mentionsScreenNames, dbScreenNames);
        var alreadyTweeted = _.contains(pastBotTweets, resItem.id_str);
        if (intersect.length > 0 && alreadyTweeted === false) {
          intersections.push(resItem.id_str);
        }
      }
    });
    log.info('twitter', intersections.length + ' new mentions found');
    callback(null, intersections);
  });
}

function tweetNewMentions (intersections, callback) {
  log.info('twitter', 'executing retweets');
  var retweeted = [];

  if (intersections.length > 0) {
    async.each(intersections, function (id, eachCallback) {
      T.post('statuses/retweet/:id', { id: id }, function (err, res) {
        if (err) {
          log.error(err); console.error(err);
          eachCallback();
        } else {
          retweeted.push(res);
          eachCallback();
        }
      });
    }, function (err) {
      if (err) log.error(err);
      log.info('twitter', retweeted.length + ' retweets executed');
      callback(null, retweeted);
    });
  } else {
    log.info('twitter', retweeted.length + ' retweets executed');
    callback(null, retweeted);
  }
}

function init () {
  db.all('select screen_name from members', function (err, names) {
    if (err) log.error(err);
    log.info('sqlite', 'fetched member names from db');
    dbScreenNames = _.pluck(names, 'screen_name');

    async.waterfall([
      getPastTweets,
      findNewMentions,
      tweetNewMentions
    ], function (asyncErr, results) {
      if (asyncErr) log.error(asyncErr);
      if (results.length > 0) {
        var dbInsert = db.prepare([
          'insert or replace into interactions',
          '("id", "screen_name", "mentioned", "text", "created_at")',
          'values (?, ?, ?, ?, ?)'
        ].join(' '));

        _.each(results, function (resItem) {
          var mentions = resItem.retweeted_status.entities.user_mentions;
          var mentionsScreenNames = _.pluck(mentions, 'screen_name');

          dbInsert.run([
            resItem.retweeted_status.id,
            resItem.retweeted_status.user.screen_name,
            mentionsScreenNames.join(','),
            resItem.retweeted_status.text,
            resItem.retweeted_status.created_at
          ], function (err) {
            if (err) log.error(err);
            log.info('sqlite', 'inserted row for ' + resItem.id);
          });
        });

        dbInsert.finalize(function () {
          db.close();
          log.info('sqlite', 'closed connection to db');
        });
      } else {
        log.info('sqlite', 'no new rows inserted');
        db.close();
        log.info('sqlite', 'closed connection to db');
      }
    });
  });
}

init();
