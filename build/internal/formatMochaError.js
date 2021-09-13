'use strict';

/* eslint-disable no-param-reassign */
/**
 * NOTE:
 * This file is was copied from https://github.com/mochajs/mocha/blob/master/lib/reporters/base.js#L167
 * Ideally we should have a better way of formattng the errors.
 */

// eslint-disable-next-line
var diff = require('diff');
var utils = require('mocha/lib/utils');

var colors = {
  pass: 90,
  fail: 31,
  'bright pass': 92,
  'bright fail': 91,
  'bright yellow': 93,
  pending: 36,
  suite: 0,
  'error title': 0,
  'error message': 31,
  'error stack': 90,
  checkmark: 32,
  fast: 90,
  medium: 33,
  slow: 31,
  green: 32,
  light: 90,
  'diff gutter': 90,
  'diff added': 32,
  'diff removed': 31
};

/**
 * Object#toString reference.
 */
var objToString = Object.prototype.toString;

/**
 * Check that a / b have the same type.
 *
 * @api private
 * @param {Object} a
 * @param {Object} b
 * @return {boolean}
 */
var sameType = function sameType(a, b) {
  return objToString.call(a) === objToString.call(b);
};

var color = function color(type, str) {
  return `\u001b[${colors[type]}m${str}\u001b[0m`;
};
/**
 * Color lines for `str`, using the color `name`.
 *
 * @api private
 * @param {string} name
 * @param {string} str
 * @return {string}
 */
function colorLines(name, str) {
  return str.split('\n').map(function (_str) {
    return color(name, _str);
  }).join('\n');
}

/**
 * Returns a string with all invisible characters in plain text
 *
 * @api private
 * @param {string} line
 * @return {string}
 */
function escapeInvisibles(line) {
  return line.replace(/\t/g, '<tab>').replace(/\r/g, '<CR>').replace(/\n/g, '<LF>\n');
}

/**
 * Returns a unified diff between two strings.
 *
 * @api private
 * @param {Error} err with actual/expected
 * @param {boolean} escape
 * @return {string} The diff.
 */
function unifiedDiff(err, escape) {
  var indent = '      ';
  function cleanUp(line) {
    if (escape) {
      line = escapeInvisibles(line);
    }
    if (line[0] === '+') {
      return indent + colorLines('diff added', line);
    }
    if (line[0] === '-') {
      return indent + colorLines('diff removed', line);
    }
    if (line.match(/@@/)) {
      return null;
    }
    if (line.match(/\\ No newline/)) {
      return null;
    }
    return indent + line;
  }
  function notBlank(line) {
    return typeof line !== 'undefined' && line !== null;
  }
  var msg = diff.createPatch('string', err.actual, err.expected);
  var lines = msg.split('\n').splice(4);
  return `\n      ${colorLines('diff added', '+ expected')} ${colorLines('diff removed', '- actual')}\n\n${lines.map(cleanUp).filter(notBlank).join('\n')}`;
}

var formatMochaError = function formatMochaError(test) {
  // msg
  var msg = void 0;
  var err = test.err;
  var message = void 0;
  if (err.message && typeof err.message.toString === 'function') {
    message = `${err.message}`;
  } else if (typeof err.inspect === 'function') {
    message = `${err.inspect()}`;
  } else {
    message = '';
  }
  var stack = err.stack || message;
  var index = message ? stack.indexOf(message) : -1;
  var actual = err.actual;
  var expected = err.expected;
  var escape = true;

  if (index === -1) {
    msg = message;
  } else {
    index += message.length;
    msg = stack.slice(0, index);
    // remove msg from stack
    stack = stack.slice(index + 1);
  }

  // uncaught
  if (err.uncaught) {
    msg = `Uncaught ${msg}`;
  }
  // explicitly show diff
  if (err.showDiff !== false && sameType(actual, expected) && expected !== undefined) {
    escape = false;
    if (!(utils.isString(actual) && utils.isString(expected))) {
      /* eslint-disable no-multi-assign */
      err.actual = actual = utils.stringify(actual);
      err.expected = expected = utils.stringify(expected);
      /* eslint-enable no-multi-assign */
    }

    var match = message.match(/^([^:]+): expected/);
    msg = `\n      ${color('error message', match ? match[1] : msg)}`;

    msg += unifiedDiff(err, escape);
  }

  return [test.fullTitle().replace(/^/gm, '    '), msg, stack].join('\n');
};

module.exports = formatMochaError;