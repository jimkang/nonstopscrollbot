var toTitleCase = require('titlecase');

var siteDomain = 'nonstopscrollshop.com';

function formatDeal(item) {
  var formatted = 'Gr8 deal on @nonstopscrshop! ';
  formatted += getDescription(item) + '\n' + cost(item) + '\n' + getLink(item) + '\n\n';
  if (item.imageURL) {
    formatted += item.imageURL
  }
  return formatted;
}

function getDescription(item) {
  var text = item.thing;
  if (item.adjective) {
    if (item.postfixAdjective) {
      text += ', ' + item.adjective;
    }
    else {
      text = item.adjective + ' ' + text;
    }
  }
  
  if (item.quantity) {
    text += ', ' + item.quantity + ' ' + item.units;
  }

  return toTitleCase(text);
}

function cost(item) {
  return '$' + item.cost;
}

function getLink(item) {
  return 'http://' + siteDomain + '/#/items/checkit/' + item.id;
}

module.exports = formatDeal;
