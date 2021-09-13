'use strict';

var path = require('path');
var cosmiconfig = require('cosmiconfig');

var explorer = cosmiconfig('jest-runner-mocha', { sync: true });

var normalize = function normalize(jestConfig, _ref) {
  var _ref$cliOptions = _ref.cliOptions,
      rawCliOptions = _ref$cliOptions === undefined ? {} : _ref$cliOptions,
      _ref$coverageOptions = _ref.coverageOptions,
      coverageOptions = _ref$coverageOptions === undefined ? { allowBabelRc: false } : _ref$coverageOptions;

  var cliOptions = Object.assign({}, rawCliOptions);

  if (cliOptions.compiler && !path.isAbsolute(cliOptions.compiler)) {
    cliOptions.compiler = path.resolve(jestConfig.rootDir, cliOptions.compiler);
  }

  if (cliOptions.file) {
    var file = [].concat(cliOptions.file);
    cliOptions.file = file.map(function (f) {
      if (path.isAbsolute(f)) {
        return f;
      }

      return path.resolve(jestConfig.rootDir, f);
    });
  }

  return { cliOptions, coverageOptions };
};

var getMochaOptions = function getMochaOptions(jestConfig) {
  var result = explorer.load(jestConfig.rootDir);

  if (result) {
    return normalize(jestConfig, result.config);
  }

  return normalize(jestConfig, {});
};

module.exports = getMochaOptions;