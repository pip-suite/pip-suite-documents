(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.pip || (g.pip = {})).documents = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process,global,setImmediate){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)

},{"_process":2,"timers":3}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":2,"timers":3}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConfigTranslations = function (pipTranslateProvider) {
    pipTranslateProvider.translations('en', {
        'FILE_DOCUMENTS': 'Upload document',
        'WEB_LINK': 'Use web link'
    });
    pipTranslateProvider.translations('ru', {
        'FILE_DOCUMENTS': 'Загрузить документ',
        'WEB_LINK': 'Вставить веб ссылка'
    });
};
ConfigTranslations.$inject = ['pipTranslateProvider'];
{
    var AddDocumentsOnChangeParams = (function () {
        function AddDocumentsOnChangeParams() {
        }
        return AddDocumentsOnChangeParams;
    }());
    var AddDocumentController_1 = (function () {
        AddDocumentController_1.$inject = ['$scope', '$element', '$mdMenu', '$timeout', 'pipDocumentUrlDialog'];
        function AddDocumentController_1($scope, $element, $mdMenu, $timeout, pipDocumentUrlDialog) {
            "ngInject";
            this.$scope = $scope;
            this.$element = $element;
            this.$mdMenu = $mdMenu;
            this.$timeout = $timeout;
            this.pipDocumentUrlDialog = pipDocumentUrlDialog;
        }
        AddDocumentController_1.prototype.openMenu = function ($mdOpenMenu) {
            if (this.$scope.ngDisabled()) {
                return;
            }
            $mdOpenMenu();
        };
        AddDocumentController_1.prototype.toBoolean = function (value) {
            if (!value) {
                return false;
            }
            value = value.toString().toLowerCase();
            return value == '1' || value == 'true';
        };
        AddDocumentController_1.prototype.isMulti = function () {
            if (this.$scope.multi !== undefined && this.$scope.multi !== null) {
                if (angular.isFunction(this.$scope.multi)) {
                    return this.toBoolean(this.$scope.multi());
                }
                else {
                    return this.toBoolean(this.$scope.multi);
                }
            }
            else {
                return true;
            }
        };
        AddDocumentController_1.prototype.hideMenu = function () {
            this.$mdMenu.hide();
        };
        AddDocumentController_1.prototype.addDocuments = function (documents) {
            var _this = this;
            if (documents === undefined) {
                return;
            }
            if (Array.isArray(documents)) {
                documents.forEach(function (img) {
                    if (_this.$scope.onChange) {
                        var params = { url: img.url, file: img.file };
                        _this.$scope.onChange(params);
                    }
                });
            }
            else {
                if (this.$scope.onChange) {
                    var params = { url: documents.url, file: documents.file };
                    this.$scope.onChange(params);
                }
            }
            if (this.$scope.$document === undefined || !Array.isArray(this.$scope.$document)) {
                return;
            }
            if (Array.isArray(documents)) {
                documents.forEach(function (img) {
                    _this.$scope.$document.push(img.url);
                });
            }
            else {
                this.$scope.$document.push(documents.url);
            }
        };
        AddDocumentController_1.prototype.onFileChange = function ($files) {
            var _this = this;
            if ($files == null || $files.length == 0) {
                return;
            }
            $files.forEach(function (file) {
                if (file.type.indexOf('image') > -1) {
                    _this.$timeout(function () {
                        var fileReader = new FileReader();
                        fileReader.readAsDataURL(file);
                        fileReader.onload = function (e) {
                            _this.$timeout(function () {
                                _this.addDocuments({ url: null, file: file });
                            });
                        };
                    });
                }
            });
        };
        AddDocumentController_1.prototype.onWebLinkClick = function () {
            var _this = this;
            this.pipDocumentUrlDialog.show(function (result) {
                _this.addDocuments({ url: result, file: null });
            });
        };
        return AddDocumentController_1;
    }());
    var AddDocument = function () {
        return {
            restrict: 'AC',
            scope: {
                $document: '=pipDocuments',
                onChange: '&pipChanged',
                multi: '&pipMulti',
                ngDisabled: '&'
            },
            transclude: true,
            templateUrl: 'add_documents/AddDocument.html',
            controller: AddDocumentController_1,
            controllerAs: 'vm'
        };
    };
    angular
        .module('pipAddDocument', ['DocumentUrlDialog'])
        .config(ConfigTranslations)
        .directive('pipAddDocument', AddDocument);
}
},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Attachment = (function () {
    function Attachment(id, uri, name) {
        this.id = id;
        this.uri = uri;
        this.name = name;
    }
    return Attachment;
}());
exports.Attachment = Attachment;
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BlobInfo = (function () {
    function BlobInfo(id, group, name, size, content_type, create_time, expire_time, completed) {
        this.id = id;
        this.group = group;
        this.name = name;
        this.size = size;
        this.content_type = content_type;
        this.create_time = create_time;
        this.expire_time = expire_time;
        this.completed = completed;
    }
    return BlobInfo;
}());
exports.BlobInfo = BlobInfo;
},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DataPage = (function () {
    function DataPage(data, total) {
        if (data === void 0) { data = null; }
        if (total === void 0) { total = null; }
        this.total = total;
        this.data = data;
    }
    return DataPage;
}());
exports.DataPage = DataPage;
},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IDocumentDataService_1 = require("./IDocumentDataService");
var DocumentData = (function () {
    DocumentData.$inject = ['_config', 'pipRest', 'pipFormat'];
    function DocumentData(_config, pipRest, pipFormat) {
        "ngInject";
        this._config = _config;
        this.pipRest = pipRest;
        this.pipFormat = pipFormat;
        this.RESOURCE = 'documents';
        this.RESOURCE_INFO = 'documentsInfo';
        this.PAGE_SIZE = 100;
        this.PAGE_START = 0;
        this.PAGE_TOTAL = true;
    }
    Object.defineProperty(DocumentData.prototype, "DocumentRoute", {
        get: function () {
            return this._config.DocumentRoute;
        },
        enumerable: true,
        configurable: true
    });
    DocumentData.prototype.getDocumentUrl = function (id) {
        return this.pipRest.serverUrl + this._config.DocumentRoute + '/' + id;
    };
    DocumentData.prototype.postDocumentUrl = function () {
        return this.pipRest.serverUrl + this._config.DocumentRoute;
    };
    DocumentData.prototype.readDocuments = function (params, successCallback, errorCallback) {
        params = params || {};
        if (params.filter) {
            params.filer = this.pipFormat.filterToString(params.filer);
        }
        return this.pipRest.getResource(this.RESOURCE).page(params, successCallback, errorCallback);
    };
    DocumentData.prototype.readDocumentInfo = function (params, successCallback, errorCallback) {
        params = params || {};
        if (params.filter) {
            params.filer = this.pipFormat.filterToString(params.filer);
        }
        return this.pipRest.getResource(this.RESOURCE_INFO).get(params, successCallback, errorCallback);
    };
    DocumentData.prototype.readDocument = function (id, successCallback, errorCallback) {
        return this.pipRest.getResource(this.RESOURCE).get({
            blob_id: id
        }, successCallback, errorCallback);
    };
    DocumentData.prototype.deleteDocument = function (id, successCallback, errorCallback) {
        this.pipRest.getResource(this.RESOURCE).remove({ blob_id: id }, null, successCallback, errorCallback);
    };
    return DocumentData;
}());
var DocumentDataProvider = (function () {
    DocumentDataProvider.$inject = ['pipRestProvider'];
    function DocumentDataProvider(pipRestProvider) {
        this.pipRestProvider = pipRestProvider;
        this._config = new IDocumentDataService_1.DocumentConfig();
        this._config.DocumentRoute = '/api/1.0/blobs';
    }
    Object.defineProperty(DocumentDataProvider.prototype, "DocumentRoute", {
        get: function () {
            return this._config.DocumentRoute;
        },
        set: function (value) {
            this._config.DocumentRoute = value;
            this.pipRestProvider.registerOperation('documents', this._config.DocumentRoute + '/:document_id');
            this.pipRestProvider.registerResource('documentInfo', this._config.DocumentRoute + '/:document_id/info');
        },
        enumerable: true,
        configurable: true
    });
    DocumentDataProvider.prototype.$get = ['pipRest', 'pipFormat', function (pipRest, pipFormat) {
        "ngInject";
        if (this._service == null) {
            this._service = new DocumentData(this._config, pipRest, pipFormat);
        }
        return this._service;
    }];
    return DocumentDataProvider;
}());
angular
    .module('pipDocumentData', ['pipRest', 'pipServices'])
    .provider('pipDocumentData', DocumentDataProvider);
},{"./IDocumentDataService":9}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DocumentConfig = (function () {
    function DocumentConfig() {
    }
    return DocumentConfig;
}());
exports.DocumentConfig = DocumentConfig;
},{}],10:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
require("./Attachment");
require("./BlobInfo");
require("./DataPage");
require("./DocumentDataService");
require("./IDocumentDataService");
angular
    .module('pipDocuments.Data', [
    'pipDocumentData'
]);
__export(require("./Attachment"));
__export(require("./BlobInfo"));
__export(require("./DataPage"));
__export(require("./IDocumentDataService"));
},{"./Attachment":5,"./BlobInfo":6,"./DataPage":7,"./DocumentDataService":8,"./IDocumentDataService":9}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DocumentListEdit_1 = require("../document_list_edit/DocumentListEdit");
var ConfigTranslations = function (pipTranslate) {
    if (pipTranslate) {
        (pipTranslate).setTranslations('en', {
            DOCUMENTS_ATTACHED: 'document(s) attached',
            ERROR_DOCUMENTS_LOADED: 'Error: <%= error_number %> document(s) are not loaded'
        });
        (pipTranslate).setTranslations('ru', {
            DOCUMENTS_ATTACHED: 'документов добавлено',
            ERROR_DOCUMENTS_LOADED: 'Ошибка: <%= error_number %> документ(ов) не загружено'
        });
    }
};
ConfigTranslations.$inject = ['pipTranslate'];
{
    var DocumentListBindings = {
        ngDisabled: '&?',
        documents: '<pipDocuments',
        collapsable: '<?pipCollapse',
        pipDocumentIcon: '<?pipDocumentIcon',
        rebind: '<?pipRebind'
    };
    var DocumentListChanges = (function () {
        function DocumentListChanges() {
        }
        return DocumentListChanges;
    }());
    var DocumentListController = (function () {
        DocumentListController.$inject = ['$element', '$attrs', 'pipTranslate', '$parse', '$scope', '$timeout', 'pipDocumentData', 'pipRest'];
        function DocumentListController($element, $attrs, pipTranslate, $parse, $scope, $timeout, pipDocumentData, pipRest) {
            "ngInject";
            this.$element = $element;
            this.$attrs = $attrs;
            this.pipTranslate = pipTranslate;
            this.$parse = $parse;
            this.$scope = $scope;
            this.$timeout = $timeout;
            this.pipDocumentData = pipDocumentData;
            this.pipRest = pipRest;
            this.documentListIcon = DocumentListEdit_1.DefaultDocumentIcon;
            this.$element.addClass('pip-document-list');
        }
        DocumentListController.prototype.$postLink = function () {
            this.documentsContainer = this.$element.children('.pip-documents-container');
            this.up = this.$element.find('.icon-up');
            this.down = this.$element.find('.icon-down');
            this.documents = this.documents || [];
            this.showDocuments = this.collapsable;
            if (!this.collapsable) {
                this.up.hide();
                this.documentsContainer.hide();
            }
            else {
                this.down.hide();
            }
            if (this.ngDisabled()) {
                this.up.hide();
                this.down.hide();
            }
        };
        DocumentListController.prototype.onDownload = function (item) {
            var e = document.createEvent('MouseEvents');
            var a = document.createElement('a');
            a.href = this.pipDocumentData.getDocumentUrl(item.id);
            ;
            a.dataset['downloadurl'] = ['undefined', a.download, a.href].join(':');
            e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
            a.dispatchEvent(e);
        };
        DocumentListController.prototype.$onChanges = function (changes) {
            if (this.toBoolean(this.rebind)) {
                if (changes.documents && changes.documents.currentValue) {
                    if (this.differentDocumentList(changes.documents.currentValue)) {
                        this.documents = changes.documents.currentValue;
                    }
                }
            }
        };
        DocumentListController.prototype.differentDocumentList = function (newList) {
            var i, obj;
            if (!this.documents || newList) {
                return true;
            }
            if (this.documents.length !== newList.length) {
                return true;
            }
            for (i = 0; i < newList.length; i++) {
                obj = _.find(this.documents, { id: newList[i].id });
                if (obj === undefined) {
                    return true;
                }
            }
            return false;
        };
        DocumentListController.prototype.onTitleClick = function (event) {
            if (event) {
                event.stopPropagation();
            }
            if (this.$attrs.disabled) {
                return;
            }
            this.showDocuments = !this.showDocuments;
            this.up[this.showDocuments ? 'show' : 'hide']();
            this.down[!this.showDocuments ? 'show' : 'hide']();
            this.documentsContainer[this.showDocuments ? 'show' : 'hide']();
        };
        DocumentListController.prototype.toBoolean = function (value) {
            if (value == null)
                return false;
            if (!value)
                return false;
            value = value.toString().toLowerCase();
            return value == '1' || value == 'true';
        };
        return DocumentListController;
    }());
    var documentList = {
        bindings: DocumentListBindings,
        templateUrl: 'document_list/DocumentList.html',
        controller: DocumentListController,
    };
    angular
        .module("pipDocumentList", ['pipFocused', 'pipDocuments.Templates'])
        .run(ConfigTranslations)
        .component('pipDocumentList', documentList);
}
},{"../document_list_edit/DocumentListEdit":12}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDocumentIcon = 'document';
var async = require('async');
var ConfigTranslations = function (pipTranslate) {
    if (pipTranslate) {
        (pipTranslate).setTranslations('en', {
            DOCUMENT_LIST_EDIT_TEXT: 'Click here to add a document',
            ERROR_TRANSACTION_IN_PROGRESS: 'Transaction is in progress. Please, wait until it\'s finished or abort'
        });
        (pipTranslate).setTranslations('ru', {
            DOCUMENT_LIST_EDIT_TEXT: 'Нажмите сюда, чтобы добавить документ',
            ERROR_TRANSACTION_IN_PROGRESS: 'Транзакция еще не завершена. Подождите окончания или прервите её'
        });
    }
};
ConfigTranslations.$inject = ['pipTranslate'];
var DocumentListEditControl = (function () {
    function DocumentListEditControl() {
        this.uploading = 0;
    }
    return DocumentListEditControl;
}());
exports.DocumentListEditControl = DocumentListEditControl;
var DocumentUploadErrors = (function () {
    function DocumentUploadErrors() {
    }
    return DocumentUploadErrors;
}());
exports.DocumentUploadErrors = DocumentUploadErrors;
var DocumentListEditItem = (function () {
    function DocumentListEditItem() {
    }
    return DocumentListEditItem;
}());
exports.DocumentListEditItem = DocumentListEditItem;
{
    var DocumentListEditBindings = {
        ngDisabled: '&?',
        pipCreated: '&?',
        pipChanged: '&?',
        documents: '=?pipDocuments',
        addedDocument: '&?pipAddedDocument',
        documentListText: '<?pipDefaultText',
        documentListIcon: '<?pipDefaultIcon',
        cancelDrag: '<?pipCanselDrag'
    };
    var DocumentListEditChanges = (function () {
        function DocumentListEditChanges() {
        }
        return DocumentListEditChanges;
    }());
    var SenderEvent = (function () {
        function SenderEvent() {
        }
        return SenderEvent;
    }());
    var DocEvent = (function () {
        function DocEvent() {
        }
        return DocEvent;
    }());
    var DocumentStates_1 = (function () {
        function DocumentStates_1() {
        }
        return DocumentStates_1;
    }());
    DocumentStates_1.Original = 'original';
    DocumentStates_1.Copied = 'copied';
    DocumentStates_1.Added = 'added';
    DocumentStates_1.Error = 'error';
    DocumentStates_1.Deleted = 'deleted';
    var DocumentListEditController = (function () {
        DocumentListEditController.$inject = ['$log', '$element', '$injector', 'pipRest', '$timeout', 'pipDocumentData', 'pipFileUpload'];
        function DocumentListEditController($log, $element, $injector, pipRest, $timeout, pipDocumentData, pipFileUpload) {
            "ngInject";
            var _this = this;
            this.$log = $log;
            this.$element = $element;
            this.$injector = $injector;
            this.pipRest = pipRest;
            this.$timeout = $timeout;
            this.pipDocumentData = pipDocumentData;
            this.pipFileUpload = pipFileUpload;
            this._itemPin = 0;
            this._pipTranslate = this.$injector.has('pipTranslate') ? this.$injector.get('pipTranslate') : null;
            this._elementDocumentDrop = $element.children('.pip-document-drop');
            if (!this.documentListText) {
                this.documentListText = 'DOCUMENT_LIST_EDIT_TEXT';
            }
            if (!this.documentListIcon) {
                this.documentListIcon = 'document';
            }
            this.iconError = 'warn-circle';
            this.documentStartState = this.toBoolean(this.addedDocument) ? DocumentStates_1.Copied : DocumentStates_1.Original;
            this.control = {
                uploading: 0,
                items: this.getItems(),
                reset: function () {
                    _this.resetDocument();
                },
                save: function (successCallback, errorCallback) {
                    _this.saveDocument(successCallback, errorCallback);
                },
                abort: function () {
                    _this.onAbort();
                },
                error: null
            };
            this.control.reset();
            this.executeCallback();
            this.$element.addClass('pip-document-list-edit');
        }
        DocumentListEditController.prototype.$onChanges = function (changes) {
            if (changes.documents && changes.documents.currentValue) {
                if (!_.isEqual(this.documents, changes.documents.currentValue)) {
                    this.control.reset();
                }
            }
        };
        DocumentListEditController.prototype.toBoolean = function (value) {
            if (value == null) {
                return false;
            }
            if (!value) {
                return false;
            }
            value = value.toString().toLowerCase();
            return value == '1' || value == 'true';
        };
        DocumentListEditController.prototype.getItems = function () {
            var items = [];
            var i;
            if (this.documents === null || this.documents.length === 0) {
                return items;
            }
            for (i = 0; i < this.documents.length; i++) {
                var item = {
                    pin: this._itemPin++,
                    id: this.documents[i].id,
                    name: this.documents[i].name,
                    uri: this.documents[i].uri,
                    uploading: false,
                    uploaded: false,
                    progress: 50,
                    file: null,
                    state: this.documentStartState,
                    error: null
                };
                items.push(item);
            }
            return items;
        };
        DocumentListEditController.prototype.setItems = function () {
            var item;
            var i;
            if (this.documents && this.documents.length > 0) {
                this.documents.splice(0, this.documents.length);
            }
            for (i = 0; i < this.control.items.length; i++) {
                item = this.control.items[i];
                if ((item.id || item.uri) && item.state != DocumentStates_1.Deleted) {
                    var newDoc = {
                        id: item.id,
                        name: item.name,
                        uri: item.uri
                    };
                    this.documents.push(newDoc);
                }
            }
        };
        DocumentListEditController.prototype.getUploadErors = function () {
            var errors = [];
            _.each(this.control.items, function (item) {
                if (item.state == DocumentStates_1.Error || item.error) {
                    errors.push({
                        id: item.id,
                        uri: item.uri,
                        name: item.name,
                        error: item.error
                    });
                }
            });
            return errors;
        };
        DocumentListEditController.prototype.isDisabled = function () {
            if (this.control.uploading) {
                return true;
            }
            if (this.ngDisabled) {
                return this.ngDisabled();
            }
            return false;
            ;
        };
        DocumentListEditController.prototype.resetDocument = function () {
            this.control.uploading = 0;
            this.control.items = this.getItems();
        };
        DocumentListEditController.prototype.deleteItem = function (item, callback) {
            if (item.upload) {
                item.upload.abort();
                item.upload = null;
            }
            if (item.state !== DocumentStates_1.Deleted) {
                return;
            }
            this.removeItem(item);
            callback();
        };
        DocumentListEditController.prototype.saveDocument = function (successCallback, errorCallback) {
            var _this = this;
            var item;
            var onItemCallback;
            var i;
            if (this.control.uploading) {
                if (errorCallback) {
                    errorCallback('ERROR_TRANSACTION_IN_PROGRESS');
                }
                return;
            }
            this.cancelQuery = null;
            this.control.error = null;
            this.control.uploading = 0;
            var addedBlobCollection = [];
            var addedUrlCollection = [];
            _.each(this.control.items, function (item) {
                if (item.state == 'added') {
                    if (!item.uri) {
                        addedBlobCollection.push(item);
                    }
                    else {
                        addedUrlCollection.push(item);
                    }
                }
            });
            var deletedCollection = _.filter(this.control.items, { state: 'deleted' });
            _.each(addedUrlCollection, function (item) {
                item.uploaded = true;
                item.uploading = false;
                item.progress = 0;
                item.upload = null;
                item.file = null;
                item.state = DocumentStates_1.Original;
            });
            if (!addedBlobCollection.length && !deletedCollection.length) {
                if (addedUrlCollection.length > 0) {
                    this.setItems();
                }
                this.control.uploading = 0;
                if (successCallback) {
                    successCallback(this.documents);
                }
                return;
            }
            this.control.uploading = addedBlobCollection.length + deletedCollection.length;
            async.parallel([
                function (callbackAll) {
                    _.each(addedBlobCollection, function (item) {
                        item.uploading = true;
                        item.progress = 0;
                    });
                    _this.pipFileUpload.multiUpload(_this.pipDocumentData.postDocumentUrl(), addedBlobCollection, function (index, data, err) {
                        var item = addedBlobCollection[index];
                        _this.addItem(item, data, err);
                        if (err) {
                            _this.control.error = true;
                        }
                    }, function (index, state, progress) {
                        var item = addedBlobCollection[index];
                        item.progress = progress;
                    }, function (error, result, res) {
                        _this.cancelQuery = null;
                        callbackAll();
                    }, function (cancelQuery) {
                        _this.cancelQuery = cancelQuery;
                    }, false, 'pin');
                },
                function (callbackAll) {
                    if (deletedCollection.length) {
                        async.each(deletedCollection, function (item, callback) {
                            _this.deleteItem(item, function (error) { callback(); });
                        }, function (error, result) {
                            callbackAll();
                        });
                    }
                    else {
                        callbackAll();
                    }
                }
            ], function (error, results) {
                if (error && !_this.control.error) {
                    _this.control.error = error;
                }
                if (_this.control.error) {
                    _this.control.uploading = 0;
                    var errors = _this.getUploadErors();
                    if (errorCallback) {
                        errorCallback(errors);
                    }
                    else {
                        _this.$log.error(_this.control.error);
                    }
                }
                else {
                    _this.setItems();
                    _this.control.uploading = 0;
                    if (successCallback) {
                        successCallback(_this.documents);
                    }
                }
            });
        };
        DocumentListEditController.prototype.addItem = function (oldItem, fileInfo, error) {
            var itemIndex = _.findIndex(this.control.items, { pin: oldItem.pin });
            if (itemIndex < 0)
                return;
            if (error) {
                this.control.items[itemIndex].uploaded = false;
                this.control.items[itemIndex].uploading = false;
                this.control.items[itemIndex].progress = 0;
                this.control.items[itemIndex].upload = null;
                this.control.items[itemIndex].state = DocumentStates_1.Error;
                this.control.items[itemIndex].error = error;
            }
            else {
                if (fileInfo) {
                    this.control.items[itemIndex].id = fileInfo.id;
                    this.control.items[itemIndex].name = fileInfo.name;
                    this.control.items[itemIndex].uploaded = true;
                    this.control.items[itemIndex].state = DocumentStates_1.Original;
                }
                else {
                    this.control.items[itemIndex].uploaded = false;
                }
                this.control.items[itemIndex].uploading = false;
                this.control.items[itemIndex].progress = 0;
                this.control.items[itemIndex].upload = null;
                this.control.items[itemIndex].file = null;
                this.control.items[itemIndex].error = null;
            }
        };
        DocumentListEditController.prototype.onAbort = function () {
            var item;
            var i;
            for (i = 0; i < this.control.items.length; i++) {
                item = this.control.items[i];
                if (item.uploading) {
                    if (item.upload) {
                        item.upload.abort();
                    }
                    item.uploaded = false;
                    item.uploading = false;
                    item.progress = 0;
                    item.upload = null;
                }
            }
            if (this.cancelQuery) {
                this.cancelQuery.resolve();
            }
            this.control.uploading = 0;
            this.control.error = true;
        };
        DocumentListEditController.prototype.filterItem = function (item) {
            return item.state !== DocumentStates_1.Deleted;
        };
        DocumentListEditController.prototype.readItemLocally = function (url, file) {
            var item = {
                pin: this._itemPin++,
                id: null,
                name: file ? file.name : url ? url.split('/').pop() : null,
                uri: !file && url ? url : null,
                uploading: false,
                uploaded: false,
                progress: 0,
                file: file ? file : null,
                state: DocumentStates_1.Added,
                error: null
            };
            this.control.items.push(item);
            this.onChange();
        };
        DocumentListEditController.prototype.removeItem = function (item) {
            if (item.state === DocumentStates_1.Added || item.state === DocumentStates_1.Copied) {
                var index = _.findIndex(this.control.items, { pin: item.pin });
                if (index > -1) {
                    this.control.items.splice(index, 1);
                }
            }
            else {
                item.state = DocumentStates_1.Deleted;
            }
        };
        DocumentListEditController.prototype.onDelete = function (item) {
            this.removeItem(item);
            this.onChange();
        };
        DocumentListEditController.prototype.onKeyDown = function ($event, item) {
            var _this = this;
            if (item) {
                if ($event.keyCode === 46 || $event.keyCode === 8) {
                    this.removeItem(item);
                    this.onChange();
                }
            }
            else if ($event.keyCode === 13 || $event.keyCode === 32) {
                setTimeout(function () {
                    _this._elementDocumentDrop.trigger('click');
                }, 0);
            }
        };
        DocumentListEditController.prototype.onChange = function () {
            if (this.pipChanged) {
                this.pipChanged({
                    $event: { sender: this.control },
                    $control: this.control
                });
            }
        };
        DocumentListEditController.prototype.executeCallback = function () {
            if (this.pipCreated) {
                this.pipCreated({
                    $event: { sender: this.control },
                    $control: this.control
                });
            }
        };
        return DocumentListEditController;
    }());
    var documentListEdit = {
        bindings: DocumentListEditBindings,
        templateUrl: 'document_list_edit/DocumentListEdit.html',
        controller: DocumentListEditController
    };
    angular
        .module("pipDocumentListEdit", ['ui.event', 'pipFocused', 'pipDocuments.Templates', 'pipFiles', 'DocumentUrlDialog'])
        .run(ConfigTranslations)
        .component('pipDocumentListEdit', documentListEdit);
}
},{"async":1}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DocumentUrlDialogService = (function () {
    DocumentUrlDialogService.$inject = ['$mdDialog'];
    function DocumentUrlDialogService($mdDialog) {
        this._mdDialog = $mdDialog;
    }
    DocumentUrlDialogService.prototype.show = function (successCallback, cancelCallback) {
        this._mdDialog.show({
            templateUrl: 'document_url_dialog/DocumentUrlDialog.html',
            clickOutsideToClose: true,
            controller: DocumentUrlDialogController,
            controllerAs: '$ctrl'
        })
            .then(function (result) {
            if (successCallback) {
                successCallback(result);
            }
        });
    };
    return DocumentUrlDialogService;
}());
var ConfigDocumentUrlDialogTranslations = function (pipTranslateProvider) {
    pipTranslateProvider.translations('en', {
        'DOCUMENT_FROM_WEBLINK': 'Add web link',
        'LINK_DOCUMENT': 'Link to the document...'
    });
    pipTranslateProvider.translations('ru', {
        'DOCUMENT_FROM_WEBLINK': 'Добавить веб ссылку',
        'LINK_DOCUMENT': 'Ссылка на документ...'
    });
};
ConfigDocumentUrlDialogTranslations.$inject = ['pipTranslateProvider'];
var DocumentUrlDialogController = (function () {
    DocumentUrlDialogController.$inject = ['$log', '$scope', '$mdDialog', '$rootScope', '$timeout', '$mdMenu'];
    function DocumentUrlDialogController($log, $scope, $mdDialog, $rootScope, $timeout, $mdMenu) {
        "ngInject";
        this.$log = $log;
        this.$scope = $scope;
        this.$mdDialog = $mdDialog;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
        this.$mdMenu = $mdMenu;
        this.url = '';
        this.invalid = true;
        this.theme = this.$rootScope[pip.themes.ThemeRootVar];
        this.ExpressionURI = /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i;
        this.regexURI = new RegExp(this.ExpressionURI);
        this.matchURI = false;
    }
    DocumentUrlDialogController.prototype.checkUrl = function () {
        if (this.url.match(this.regexURI)) {
            this.matchURI = true;
        }
        else {
            this.matchURI = false;
        }
    };
    ;
    DocumentUrlDialogController.prototype.onCancelClick = function () {
        this.$mdDialog.cancel();
    };
    ;
    DocumentUrlDialogController.prototype.onAddClick = function () {
        this.$mdDialog.hide(this.url);
    };
    ;
    return DocumentUrlDialogController;
}());
angular
    .module('DocumentUrlDialog', ['ngMaterial', 'pipDocuments.Templates'])
    .service('pipDocumentUrlDialog', DocumentUrlDialogService)
    .config(ConfigDocumentUrlDialogTranslations);
},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
},{}],15:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
require("./document_url_dialog/DocumentUrlDialogService");
require("./document_url_dialog/IDocumentUrlDialogService");
require("./document_list/DocumentList");
require("./document_list_edit/DocumentListEdit");
require("./rest");
require("./data");
require("./add_documents/AddDocument");
angular
    .module('pipDocuments', [
    'DocumentUrlDialog',
    'pipAddDocument',
    'pipDocuments.Rest',
    'pipDocuments.Data',
    'pipDocumentList',
    'pipDocumentListEdit'
]);
__export(require("./document_list_edit/DocumentListEdit"));
__export(require("./data"));
},{"./add_documents/AddDocument":4,"./data":10,"./document_list/DocumentList":11,"./document_list_edit/DocumentListEdit":12,"./document_url_dialog/DocumentUrlDialogService":13,"./document_url_dialog/IDocumentUrlDialogService":14,"./rest":18}],16:[function(require,module,exports){
configDocumentResources.$inject = ['pipRestProvider'];
function configDocumentResources(pipRestProvider) {
    pipRestProvider.registerPagedCollection('documents', '/api/1.0/blobs/:document_id', { blob_id: '@document_id' }, {
        page: { method: 'GET', isArray: false },
        update: { method: 'PUT' }
    });
    pipRestProvider.registerResource('documentInfo', '/api/1.0/blobs/:document_id/info');
}
angular
    .module('pipDocuments.Rest')
    .config(configDocumentResources);
},{}],17:[function(require,module,exports){
configFileResources.$inject = ['pipRestProvider'];
function configFileResources(pipRestProvider) {
    pipRestProvider.registerPagedCollection('files', '/api/1.0/files/:file_id');
}
angular
    .module('pipDocuments.Rest')
    .config(configFileResources);
},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
angular
    .module('pipDocuments.Rest', []);
require("./DocumentResources");
require("./FileResources");
},{"./DocumentResources":16,"./FileResources":17}],19:[function(require,module,exports){
(function(module) {
try {
  module = angular.module('pipDocuments.Templates');
} catch (e) {
  module = angular.module('pipDocuments.Templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('add_documents/AddDocument.html',
    '<md-menu>\n' +
    '        <ng-transclude class="pip-add-image-open-button" ng-click="vm.openMenu($mdOpenMenu)"\n' +
    '                xxxng-click="vm.ngDisabled() ? \'\' : $mdOpenMenu()"></ng-transclude>\n' +
    '        <md-menu-content width="4">\n' +
    '            <md-menu-item>\n' +
    '                <md-button class="layout-row layout-align-start-center" accept="image/*"\n' +
    '                           ng-keydown="vm.onKeyDown($event)" ng-multiple="vm.isMulti()"\n' +
    '                           ng-file-select ng-file-change="vm.onFileChange($files)" ng-click="vm.hideMenu()" ng-file-drop>\n' +
    '                    <md-icon class="text-headline text-grey rm24-flex" md-svg-icon="icons:folder"></md-icon>\n' +
    '                    <span class="text-grey">{{ ::\'FILE_DOCUMENTS\' | translate }}</span>\n' +
    '                </md-button>\n' +
    '            </md-menu-item>\n' +
    '            <md-menu-item>\n' +
    '                <md-button class="layout-row layout-align-start-center" ng-click="vm.onWebLinkClick()">\n' +
    '                    <md-icon class="text-headline text-grey rm24-flex" md-svg-icon="icons:weblink"></md-icon>\n' +
    '                    <span class="text-grey">{{ ::\'WEB_LINK\' | translate }}</span>\n' +
    '                </md-button>\n' +
    '            </md-menu-item>\n' +
    '        </md-menu-content>\n' +
    '    </md-menu>');
}]);
})();

(function(module) {
try {
  module = angular.module('pipDocuments.Templates');
} catch (e) {
  module = angular.module('pipDocuments.Templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('document_list/DocumentList.html',
    '<md-button class="pip-documents-name" ng-class="{\'lp24-flex rp16\': $ctrl.pipDocumentIcon }" ng-click="$ctrl.onTitleClick($event); $ctrl.onResize()"\n' +
    '    aria-label="RESIZE">\n' +
    '\n' +
    '    <div class="layout-align-start-center layout-row w-stretch">\n' +
    '        <md-icon md-svg-icon="icons:document" ng-class="{\'pip-icon\': $ctrl.pipDocumentIcon}" ng-if="$ctrl.pipDocumentIcon"></md-icon>\n' +
    '        <span class="pip-documents-text">\n' +
    '            {{ $ctrl.documents.length }} {{ ::\'DOCUMENTS_ATTACHED\' | translate }}\n' +
    '        </span>\n' +
    '\n' +
    '        <md-icon class="icon-up" md-svg-icon="icons:triangle-up"></md-icon>\n' +
    '        <md-icon class="icon-down" md-svg-icon="icons:triangle-down"></md-icon>\n' +
    '    </div>\n' +
    '</md-button>\n' +
    '<div pip-focused class="pip-documents-container bm8" ng-class="{ \'lp24-flex rp24-flex\': $ctrl.pipDocumentIcon }">\n' +
    '    <md-button class="pip-document-download md-primary" ng-if="document.uri" ng-class="{\'pip-focusable\' : !$ctrl.ngDisabled()}"\n' +
    '        href="{{ document.uri }}" target="_blank" ng-disabled="$ctrl.ngDisabled() || $ctrl.document.error" \n' +
    '        ng-repeat="document in $ctrl.documents track by $index"\n' +
    '        aria-label="DOCUMENT">\n' +
    '\n' +
    '        <div class="pip-default-icon">\n' +
    '            <md-icon md-svg-icon="icons:{{::$ctrl.documentListIcon}}"></md-icon>\n' +
    '        </div>\n' +
    '        <div class="pip-document-title">\n' +
    '            {{ ::document.name }}\n' +
    '        </div>\n' +
    '    </md-button>\n' +
    '    <md-button class="pip-document-download md-primary" ng-if="!document.uri" ng-class="{\'pip-focusable\' : !$ctrl.ngDisabled()}"\n' +
    '        ng-click="$ctrl.onDownload(document)" target="_blank" ng-disabled="$ctrl.ngDisabled() || $ctrl.document.error" \n' +
    '        ng-repeat="document in $ctrl.documents track by $index"\n' +
    '        aria-label="DOCUMENT">\n' +
    '\n' +
    '        <div class="pip-default-icon">\n' +
    '            <md-icon md-svg-icon="icons:{{::$ctrl.documentListIcon}}"></md-icon>\n' +
    '        </div>\n' +
    '        <div class="pip-document-title">\n' +
    '            {{ ::document.name }}\n' +
    '        </div>\n' +
    '    </md-button>\n' +
    '</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('pipDocuments.Templates');
} catch (e) {
  module = angular.module('pipDocuments.Templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('document_list/DocumentListCollapse.html',
    '<div class="pip-documents-name" ng-click="$ctrl.onTitleClick($event); $ctrl.onResize()">\n' +
    '    <span class="pip-documents-text">\n' +
    '        {{ documents.length }} {{ ::\'DOCUMENTS_ATTACHED\' | translate }}\n' +
    '    </span>\n' +
    '\n' +
    '    <md-icon class="icon-up" md-svg-icon="icons:triangle-up"></md-icon>\n' +
    '    <md-icon class="icon-down" md-svg-icon="icons:triangle-down"></md-icon>\n' +
    '</div>\n' +
    '<div pip-focused class="pip-documents-container bm8">\n' +
    '    <md-button class="pip-document-download pip-focusable md-primary"\n' +
    '               href="{{::$ctrl.document.url}}"\n' +
    '               target="_blank"\n' +
    '               ng-repeat="document in $ctrl.documents track by document.id"\n' +
    '               aria-label="DOCUMENT">\n' +
    '        <div class="pip-default-icon">\n' +
    '            <md-icon md-svg-icon="icons:{{::$ctrl.icon}}"></md-icon>\n' +
    '        </div>\n' +
    '        <div class="pip-document-title">\n' +
    '            {{ ::$ctrl.document.name }}\n' +
    '        </div>\n' +
    '    </md-button>\n' +
    '</div>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('pipDocuments.Templates');
} catch (e) {
  module = angular.module('pipDocuments.Templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('document_list_edit/DocumentListEdit.html',
    '<div pip-focusable>\n' +
    '	<div class="pip-document-upload pointer md-primary "\n' +
    '		 ng-class="{\'pip-focusable\' : !$ctrl.ngDisabled(), \'pip-item-error\' : item.state == \'error\'}"\n' +
    '		 ng-keydown="$ctrl.onKeyDown($event, item)"\n' +
    '		 tabindex="{{ $ctrl.ngDisabled() ? -1 : 0 }}"\n' +
    '		 ng-repeat="item in $ctrl.control.items | filter: $ctrl.filterItem track by $index">\n' +
    '\n' +
    '		<div class="pip-default-icon"\n' +
    '			 ng-class="{ \'pip-document-new\': item.state == \'added\' || item.state == \'copied\' }">\n' +
    '			<md-icon pip-cancel-drag="true" class="md-primary" ng-if="item.state == \'original\' || item.state == \'added\'"\n' +
    '					 md-svg-icon="icons:{{::$ctrl.documentListIcon}}">\n' +
    '			</md-icon>\n' +
    '			<md-icon pip-cancel-drag="true" class="md-warn" ng-if="item.state == \'error\'"\n' +
    '					 md-svg-icon="icons:{{::$ctrl.iconError}}">\n' +
    '			</md-icon>\n' +
    '		</div>\n' +
    '\n' +
    '		<div class="pip-document-title" pip-cancel-drag="true">\n' +
    '			{{ item.name }}\n' +
    '		</div>\n' +
    '		<md-button ng-click="$ctrl.onDelete(item)"\n' +
    '				   ng-disabled="$ctrl.isDisabled()"\n' +
    '				   tabindex="-1"\n' +
    '				   ng-hide="$ctrl.ngDisabled()"\n' +
    '				   class="md-icon-button" aria-label="DELETE">\n' +
    '\n' +
    '			<md-icon md-svg-icon="icons:cross" pip-cancel-drag="true"></md-icon>\n' +
    '		</md-button>\n' +
    '		<md-progress-linear md-mode="determinate" ng-show="item.uploading" ng-value="item.progress"></md-progress-linear>\n' +
    '	</div>\n' +
    '	\n' +
    '	<button class="pip-document-upload pip-document-drop "\n' +
    '			ng-class="{\'pip-focusable\' : !$ctrl.ngDisabled()}"\n' +
    '			ng-keydown="$ctrl.onKeyDown($event)" tabindex="0"\n' +
    '			xxxng-file-drop xxxng-file-select xxxng-file-change="$ctrl.onSelect($files)"\n' +
    '			pip-changed="$ctrl.readItemLocally(url, file)"\n' +
    '			xxng-multiple="true"\n' +
    '			pip-multi="true"\n' +
    '			ng-disabled="$ctrl.ngDisabled()"\n' +
    '			aria-label="UPLOAD"  pip-add-document>\n' +
    '\n' +
    '		<div class="pip-default-icon">\n' +
    '			<md-icon pip-cancel-drag="true" md-svg-icon="icons:{{ ::$ctrl.documentListIcon }}"></md-icon>\n' +
    '		</div>\n' +
    '		<div class="pip-default-text">\n' +
    '			<span>\n' +
    '				{{ $ctrl.documentListText | translate }}\n' +
    '			</span>\n' +
    '		</div>\n' +
    '	</button>\n' +
    '	<div class="clearfix"></div>\n' +
    '</div>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('pipDocuments.Templates');
} catch (e) {
  module = angular.module('pipDocuments.Templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('document_url_dialog/DocumentUrlDialog.html',
    '<md-dialog class="pip-dialog pip-document-url-dialog pip-document-dialog layout-column"\n' +
    '           md-theme="{{ $ctrl.theme }}">\n' +
    '\n' +
    '    <md-dialog-content class="pip-body lp0 rp0 tp0 pip-scroll">\n' +
    '        <div class="pip-header bm16 layout-row layout-align-start-center">\n' +
    '            <md-button  ng-click="$ctrl.onCancelClick()" class="md-icon-button lm0"\n' +
    '                        aria-label="{{ ::\'CANCEL\' | translate }}">\n' +
    '                <md-icon class="text-grey" md-svg-icon="icons:arrow-left"></md-icon>\n' +
    '            </md-button>\n' +
    '            <h3 class="text-title m0">\n' +
    '                {{ ::\'DOCUMENT_FROM_WEBLINK\' | translate}}\n' +
    '            </h3>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="pip-content lp16 rp16">\n' +
    '            <md-input-container md-no-float class="w-stretch text-subhead1">\n' +
    '                <input type="text" ng-model="$ctrl.url" ng-change="$ctrl.checkUrl()" placeholder="{{ ::\'LINK_DOCUMENT\' | translate }}"/>\n' +
    '            </md-input-container>\n' +
    '        </div>\n' +
    '    </md-dialog-content>\n' +
    '    <div class="pip-footer">\n' +
    '        <md-button ng-click="$ctrl.onCancelClick()" aria-label="{{ ::\'CANCEL\' | translate }}">\n' +
    '            {{ ::\'CANCEL\' | translate }}\n' +
    '        </md-button>\n' +
    '\n' +
    '        <md-button class="md-accent" ng-click="$ctrl.onAddClick()" \n' +
    '                   aria-label="{{ ::\'ADD\' | translate }}" ng-disabled="!$ctrl.matchURI">\n' +
    '            {{ ::\'ADD\' | translate }}\n' +
    '        </md-button>\n' +
    '    </div>\n' +
    '</md-dialog>');
}]);
})();



},{}]},{},[19,4,5,6,7,8,9,10,12,11,13,14,15,16,17,18])(19)
});

//# sourceMappingURL=pip-suite-documents.js.map
