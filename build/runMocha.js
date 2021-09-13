'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Mocha = require('mocha');
var toTestResult = require('./utils/toTestResult');
var setupCollectCoverage = require('./utils/setupCollectCoverage');
var getMochaOptions = require('./utils/getMochaOptions');

var runMocha = function runMocha(_ref, workerCallback) {
  var config = _ref.config,
      testPath = _ref.testPath,
      globalConfig = _ref.globalConfig;

  var _getMochaOptions = getMochaOptions(config),
      mochaOptions = _getMochaOptions.cliOptions,
      coverageOptions = _getMochaOptions.coverageOptions;

  var Reporter = function (_Mocha$reporters$Base) {
    _inherits(Reporter, _Mocha$reporters$Base);

    function Reporter(runner) {
      _classCallCheck(this, Reporter);

      var _this = _possibleConstructorReturn(this, (Reporter.__proto__ || Object.getPrototypeOf(Reporter)).call(this, runner));

      var tests = [];
      var pending = [];
      var failures = [];
      var passes = [];

      runner.on('test end', function (test) {
        return tests.push(test);
      });
      runner.on('pass', function (test) {
        return passes.push(test);
      });
      runner.on('fail', function (test, err) {
        test.err = err;
        failures.push(test);
      });
      runner.on('pending', function (test) {
        return pending.push(test);
      });
      runner.on('end', function () {
        try {
          workerCallback(null, toTestResult({
            stats: _this.stats,
            tests,
            pending,
            failures,
            passes,
            coverage: global.__coverage__,
            jestTestPath: testPath
          }));
        } catch (e) {
          workerCallback(e);
        }
      });
      return _this;
    }

    return Reporter;
  }(Mocha.reporters.Base);

  var mocha = new Mocha({
    reporter: Reporter,
    timeout: mochaOptions.timeout
  });

  if (mochaOptions.compiler) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    require(mochaOptions.compiler);
  }

  setupCollectCoverage({
    filename: testPath,
    rootDir: config.rootDir,
    collectCoverage: globalConfig.collectCoverage,
    coveragePathIgnorePatterns: config.coveragePathIgnorePatterns,
    allowBabelRc: coverageOptions.useBabelRc
  });

  if (mochaOptions.file) {
    mochaOptions.file.forEach(function (file) {
      return mocha.addFile(file);
    });
  }

  mocha.addFile(testPath);

  var onEnd = function onEnd() {
    process.on('exit', function () {
      return process.exit();
    });
  };

  try {
    if (mochaOptions.ui) {
      mocha.ui(mochaOptions.ui).run(onEnd);
    } else {
      mocha.run(onEnd);
    }
  } catch (e) {
    workerCallback(e);
  }
};

module.exports = runMocha;