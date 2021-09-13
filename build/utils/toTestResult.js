'use strict';

var formatMochaError = require('../internal/formatMochaError');

var hasError = function hasError() {
  var test = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return test.err instanceof Error || test.err && Object.keys(test.err).length > 0;
};
var toMochaError = function toMochaError(test) {
  return hasError(test) ? `\n${formatMochaError(test)}\n\n` : null;
};

var getFailureMessages = function getFailureMessages(tests) {
  var failureMessages = tests.filter(hasError).map(toMochaError);
  return failureMessages.length ? failureMessages : null;
};

var getAncestorTitle = function getAncestorTitle(test) {
  if (test.parent && test.parent.title) {
    return [test.parent.title].concat(getAncestorTitle(test.parent));
  }

  return [];
};

var toTestResult = function toTestResult(_ref) {
  var stats = _ref.stats,
      tests = _ref.tests,
      failures = _ref.failures,
      jestTestPath = _ref.jestTestPath,
      coverage = _ref.coverage;

  var effectiveTests = tests;

  // Merge failed tests that don't exist in the tests array so that we report
  // all tests even if an error occurs in a beforeEach block.
  failures.forEach(function (test) {
    if (!tests.some(function (t) {
      return t === test;
    })) {
      tests.push(test);
    }
  });

  return {
    coverage,
    console: null,
    failureMessage: getFailureMessages(effectiveTests),
    numFailingTests: stats.failures,
    numPassingTests: stats.passes,
    numPendingTests: stats.pending,
    perfStats: {
      end: +new Date(stats.end),
      start: +new Date(stats.start)
    },
    skipped: false,
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      unmatched: 0,
      updated: 0
    },
    sourceMaps: {},
    testExecError: null,
    testFilePath: jestTestPath,
    testResults: effectiveTests.map(function (test) {
      var failureMessage = toMochaError(test);
      return {
        ancestorTitles: getAncestorTitle(test),
        duration: test.duration / 1000,
        failureMessages: failureMessage ? [failureMessage] : [],
        fullName: test.fullTitle(),
        numPassingAsserts: hasError(test) ? 1 : 0,
        status: hasError(test) ? 'failed' : 'passed',
        title: test.title
      };
    })
  };
};

module.exports = toTestResult;