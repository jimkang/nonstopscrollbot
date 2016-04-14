#!/usr/bin/env node

var config = require('./config');
var callNextTick = require('call-next-tick');
var Twit = require('twit');
var MakeMerch = require('makemerch');
var async = require('async');
var request = require('request');
var formatDeal = require('./format-deal');

var warehouseURL = 'http://45.55.32.243:3001';

var dryRun = false;
if (process.argv.length > 2) {
  dryRun = (process.argv[2].toLowerCase() == '--dry');
}

var makeMerch = MakeMerch({
  wordnikAPIKey: config.wordnikAPIKey,
  flickrAPIKey: config.flickrAPIKey,
  request: request,
  includeImages: true
});

var twit = new Twit(config.twitter);

async.waterfall(
  [
    start,
    storeItem,
    postTweet
  ],
  wrapUp
);

function start(done) {
  makeMerch(1, done);
}

function storeItem(items, done) {
  if (items.length < 0) {
    done(new Error('Got no items!'));
  }
  else {
    var item = items[0];
    var reqOpts = {
      method: 'POST',
      url: warehouseURL,
      json: true,
      body: [
        [
          {
            id: 'saveItemOp-' + item.id,
            op: 'saveItem',
            params: item
          }
        ]
      ]
    };
    request(reqOpts, reqDone);
  }

  function reqDone(error, result) {
    if (error) {
        console.log(error, result);
        done(error);
    }
    else {
      // Pass back item.
      done(null, item);
    }
  }
}

function postTweet(item, done) {
  var text = formatDeal(item, warehouseURL);

  if (dryRun) {
    console.log('Would have tweeted:', text);
    callNextTick(done);
  }
  else {
    var body = {
      status: text
    };
    twit.post('statuses/update', body, done);
  }
}

function wrapUp(error, data) {
  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }
  }
}
