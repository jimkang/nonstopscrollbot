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

function postTweet(item, postTweetDone) {
  async.waterfall(
    [
      getImageURL,
      getImage,
      postMedia,
      postTweet
    ],
    postTweetDone
  );

  function getImageURL(done) {
    var imageURL;
    if (item.largeImageURL) {
      imageURL = item.largeImageURL;
    }
    else  if (item.imageURL) {
      imageURL = imageURL;
    }
    var error = null;

    if (!imageURL) {
      error = new Error('Item does not have an image.');
    }
    callNextTick(done, error, imageURL);
  }

  function postMedia(imageResponse, done) {
    var mediaPostOpts = {
      media_data: new Buffer(imageResponse.body).toString('base64')
    };
    twit.post('media/upload', mediaPostOpts, done);
  }

  function postTweet(mediaPostData, response, done) {
    var text = formatDeal(item, warehouseURL);

    if (dryRun) {
      console.log('Would have tweeted:', text);
      callNextTick(done);
    }
    else {
      var body = {
        status: text,
        media_ids: [
          mediaPostData.media_id_string
        ]
      };
      twit.post('statuses/update', body, done);
    }
  }
}

function getImage(url, done) {
  var requestOpts = {
    url: url,
    encoding: null
  };
  request(requestOpts, checkResponse);

  function checkResponse(error, response) {
    if (error) {
      done(error);
    }
    else if (response.statusCode !== 200) {
      done(new Error('Could not get image. Status code: ' + response.statusCode));
    }
    else if (response.headers['content-type'].indexOf('image/') !== 0) {
      done(new Error('Did not receive image as response.'));
    }
    else {
      done(null, response);
    }
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
