'use strict';

var minimatch = require('minimatch');

var setupCollectCoverage = function setupCollectCoverage(_ref) {
  var rootDir = _ref.rootDir,
      collectCoverage = _ref.collectCoverage,
      coveragePathIgnorePatterns = _ref.coveragePathIgnorePatterns,
      allowBabelRc = _ref.allowBabelRc;

  if (!collectCoverage) {
    return;
  }

  // eslint-disable-next-line import/no-dynamic-require, global-require
  var register = require('babel-register');
  register({
    plugins: [['babel-plugin-istanbul', {
      // files outside `cwd` will not be instrumented
      cwd: rootDir,
      useInlineSourceMaps: false,
      exclude: coveragePathIgnorePatterns
    }]],
    ignore: function ignore(filename) {
      return (/node_modules/.test(filename) || coveragePathIgnorePatterns.some(function (pattern) {
          return minimatch(filename, pattern);
        })
      );
    },
    babelrc: allowBabelRc,
    // compact: true,
    retainLines: true,
    sourceMaps: 'inline'
  });
};

module.exports = setupCollectCoverage;