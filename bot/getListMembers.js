#!/usr/bin/env node

// Get a clean array of all members on list

var _ = require('lodash');
var async = require('async');

var index = require('../index');
var T = require('./initTwit');

var listInfo = index.config.listInfo;
var log = index.log;
var db = index.db;

var cursor = -1;

function getNewMembers (fetchedMembers, dbIDs) {
  db.all('select id from members', function (err, ids) {
    dbIDs = _.pluck(ids, 'id');
    var dbInsert = db.prepare('insert or replace into members ("id", "screen_name") values (?, ?)');

    _.each(fetchedMembers, function (resItem) {
      if (!_.contains(dbIDs, resItem.id)) {
        dbInsert.run([resItem.id, resItem.screen_name], function (err) {
          if (err) console.error(err);
          log.info('sqlite', 'inserted row for ' + resItem.id);
        });
      } else {
        log.info('sqlite', 'row already exists for ' + resItem.id);
      }
    });

    dbInsert.finalize();
  });
}

function getMembers (cursorVal, callback) {
  listInfo.cursor = cursorVal;

  T.get('lists/members', listInfo, function (err, res) {
    if (err) console.error(err);
    log.info('twitter', 'fetched data from cursor', cursorVal);
    getNewMembers(res.users);
    cursor = res.next_cursor;
    callback();
  });
}

function init () {
  // Page through results as long as there is data
  async.whilst(
    function () { return (cursor !== 0); },
    function (callback) {
      getMembers(cursor, callback);
    },
    function (err) {
      if (err) console.error(err);
      db.close();
      log.info('sqlite', 'closed connection to db');
    }
  );
}

init();
