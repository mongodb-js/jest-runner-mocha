'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var throat = require('throat');
var pify = require('pify');
var workerFarm = require('worker-farm');
var path = require('path');

var TEST_WORKER_PATH = path.join(__dirname, 'runMocha.js');

var CancelRun = function (_Error) {
  _inherits(CancelRun, _Error);

  function CancelRun(message) {
    _classCallCheck(this, CancelRun);

    var _this = _possibleConstructorReturn(this, (CancelRun.__proto__ || Object.getPrototypeOf(CancelRun)).call(this, message));

    _this.name = 'CancelRun';
    return _this;
  }

  return CancelRun;
}(Error);

module.exports = function () {
  function MochaTestRunner(globalConfig) {
    _classCallCheck(this, MochaTestRunner);

    this._globalConfig = globalConfig;
  }

  // eslint-disable-next-line


  _createClass(MochaTestRunner, [{
    key: 'runTests',
    value: function runTests(tests, watcher, onStart, onResult, onFailure) {
      var _this2 = this;

      var farm = workerFarm({
        autoStart: true,
        maxConcurrentCallsPerWorker: 1,
        maxConcurrentWorkers: this._globalConfig.maxWorkers,
        maxRetries: 2 // Allow for a couple of transient errors.
      }, TEST_WORKER_PATH);

      var mutex = throat(this._globalConfig.maxWorkers);
      var worker = pify(farm);

      var runTestInWorker = function runTestInWorker(test) {
        return mutex(function () {
          if (watcher.isInterrupted()) {
            throw new CancelRun();
          }
          return onStart(test).then(function () {
            return worker({
              config: test.context.config,
              globalConfig: _this2._globalConfig,
              testPath: test.path,
              rawModuleMap: watcher.isWatchMode() ? test.context.moduleMap.getRawModuleMap() : null
            });
          });
        });
      };

      var onError = function onError(err, test) {
        return onFailure(test, err).then(function () {
          if (err.type === 'ProcessTerminatedError') {
            // eslint-disable-next-line no-console
            console.error('A worker process has quit unexpectedly! ' + 'Most likely this is an initialization error.');
            process.exit(1);
          }
        });
      };

      var onInterrupt = new Promise(function (_, reject) {
        watcher.on('change', function (state) {
          if (state.interrupted) {
            reject(new CancelRun());
          }
        });
      });

      var runAllTests = Promise.all(tests.map(function (test) {
        return runTestInWorker(test).then(function (testResult) {
          return onResult(test, testResult);
        }).catch(function (error) {
          return onError(error, test);
        });
      }));

      var cleanup = function cleanup() {
        return workerFarm.end(farm);
      };

      return Promise.race([runAllTests, onInterrupt]).then(cleanup, cleanup);
    }
  }]);

  return MochaTestRunner;
}();