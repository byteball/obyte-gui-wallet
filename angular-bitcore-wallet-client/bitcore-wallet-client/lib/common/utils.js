'use strict';

var _ = require('lodash');
var $ = require('preconditions').singleton();


var Constants = require('./constants');

function Utils() {};









Utils.formatAmount = function(bytes, unit, opts) {
  $.shouldBeNumber(bytes);
  $.checkArgument(_.includes(_.keys(Constants.UNITS), unit));

  function addSeparators(nStr, thousands, decimal, minDecimals) {
    nStr = nStr.replace('.', decimal);
    var x = nStr.split(decimal);
    var x0 = x[0];
    var x1 = x[1];

    x1 = _.dropRightWhile(x1, function(n, i) {
        return n == '0' && i >= minDecimals;
    }).join('');
    var x2 = x.length > 1 && parseInt(x[1]) ? decimal + x1 : '';

    // in safari, toLocaleString doesn't add thousands separators
    if (navigator && navigator.vendor && navigator.vendor.indexOf('Apple') >= 0) {
			x0 = x0.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
			return x0 + x2;
		}
    else {
			return parseFloat(x0 + x2).toLocaleString();
		}
  }

  opts = opts || {};

  var u = Constants.UNITS[unit];
  var intAmountLength = Math.floor(bytes / u.value).toString().length;
  var digits = intAmountLength >= 6 || unit == 'one' ? 0 : 6 - intAmountLength;
  var amount = (bytes / u.value).toFixed(digits);
  return addSeparators(amount, opts.thousandsSeparator || ',', opts.decimalSeparator || '.', u.minDecimals);
};

module.exports = Utils;
