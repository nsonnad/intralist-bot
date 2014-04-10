// Filesystem operations to load/save cached data and config

var path = require('path');
var fs = require('fs');
var log = require('npmlog');
var sqlite3 = require('sqlite3').verbose();
var config = require('./config.json');

log.heading = config.botInfo.screen_name;
log.info('loaded config');

var currentdate = new Date(); 
var datetime = currentdate.getDate() + "/"
      + (currentdate.getMonth()+1)  + "/" 
      + currentdate.getFullYear() + "|"  
      + currentdate.getHours() + ":"  
      + currentdate.getMinutes() + ":" 
      + currentdate.getSeconds();

log.info('initializing diplomatwee @ ' + datetime);

var dbFile = config.botInfo.screen_name + '.sqlite';
var dbExists = fs.existsSync(dbFile);

if (!dbExists) {
  db = new sqlite3.Database(dbFile);
  log.info('sqlite', 'initializing database with tables: MEMBERS, INTERACTIONS');

  db.serialize(function () {
    db.run('create table if not exists members (id integer, screen_name)');
    db.run('create table if not exists interactions (id integer, screen_name, mentioned, text, created_at)');
  });

  log.info('sqlite', 'connected to sqlite at ' + dbFile);
} else {
  db = new sqlite3.Database(dbFile);
  log.info('sqlite', 'connected to sqlite at ' + dbFile);
}

module.exports = {
  config: config,
  log: log,
  db: db
};

