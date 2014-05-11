(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(this.smartypants(cap[0]));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/--/g, '\u2014')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function() {
      var out, err;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else {
        Q = definition();
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be fulfilled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return result.value;
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return exception.value;
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

Promise.prototype.timeout = function (ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require("FWaASH"))
},{"FWaASH":1}],5:[function(require,module,exports){
var Q = require('q');
var _ = require('lodash');
var marked = require('marked');

var Firepad = require('./firepad');

(function (window, undefined) {
  "use strict";

  var document = window.document;
  var ace = window.ace;
  var sessionStorage = window.sessionStorage;

  var Collcode = {};

  marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  });

  function autoRefFromHash() {
    // Get hash from end of URL or generate a random one.
    var ref = new Firebase('https://code-dohzya.firebaseIO.com');
    var hash = window.location.hash.replace(/#/g, '');
    if (hash) {
      ref = ref.child(hash);
    } else {
      ref = ref.push(); // generate unique location.
      window.location = window.location + '#' + ref.name(); // add it as a hash to the URL.
    }
    return ref;
  }

  function changeKeybinding(ctx, keybinding) {
    var handler;
    if (keybinding == 'ace') {
      handler = ctx.defaultKeyboardHandler;
    } else {
      handler = ace.require("ace/keyboard/"+keybinding).handler;
    }
    ctx.editor.setKeyboardHandler(handler);
    ctx.keybinding = keybinding;
    ctx.optsKeybinding.value = ctx.keybinding;
    sessionStorage.setItem("keybinding", keybinding);
  }

  function notifyMode(ctx) {
    ctx.firebase.update({mode: ctx.mode});
  }

  function changeMode(ctx, mode, notify) {
    ctx.session.setMode("ace/mode/"+mode);
    ctx.mode = mode;
    ctx.optsMode.value = ctx.mode;
    if (notify) {
      notifyMode(ctx);
    }
  }

  function changeTheme(ctx, theme) {
    ctx.editor.setTheme("ace/theme/"+theme);
    ctx.theme = theme;
    ctx.optsTheme.value = ctx.theme;
    sessionStorage.setItem("theme", theme);
  }

  function init() {
    var ctx = Collcode;

    var opts = document.querySelector('#options');
    ctx.optsKeybinding = opts.querySelector('[name="keybinding"]');
    ctx.optsKeybinding.addEventListener('change', function () {
      changeKeybinding(ctx, ctx.optsKeybinding.value);
    });

    ctx.optsMode = opts.querySelector('[name="mode"]');
    ctx.optsMode.addEventListener('change', function () {
      changeMode(ctx, ctx.optsMode.value, true);
    });

    ctx.optsTheme = opts.querySelector('[name="theme"]');
    ctx.optsTheme.addEventListener('change', function () {
      changeTheme(ctx, ctx.optsTheme.value);
    });

    ctx.firebase = autoRefFromHash();
    ctx.editor = ace.edit("editor");
    ctx.defaultKeyboardHandler = ctx.editor.getKeyboardHandler();
    var theme = sessionStorage.getItem("theme") || 'ambiance';
    changeTheme(ctx, theme);
    var keybinding = sessionStorage.getItem("keybinding") || 'ace';
    changeKeybinding(ctx, keybinding);
    ctx.session = ctx.editor.getSession();
    ctx.session.setUseWrapMode(true);
    ctx.session.setUseWorker(false);

    var received = false;
    ctx.firebase.on('value', function(snapshot) {
      var message = snapshot.val();
      received = true;
      if (message.mode) {
        changeMode(ctx, message.mode);
      }
    });

    changeMode(ctx, 'scala', false);

    setTimeout(function () {
      if (!received) {
        notifyMode(ctx);
      }
    }, 5000);

    ctx.firepad = Firepad.fromACE(ctx.firebase, ctx.editor);

  }

  Collcode.init = init;

  window.Collcode = Collcode;

}(window));

},{"./firepad":6,"lodash":2,"marked":3,"q":4}],6:[function(require,module,exports){
/*
 * Firepad http://www.firepad.io/
 *
 * Copyright 2013 Firebase
 * with code from ot.js (Copyright 2012-2013 Tim Baumann)
 */

(function (name, definition, context) {
  //try CommonJS, then AMD (require.js), then use global.
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof context['define'] == 'function' && context['define']['amd']) define(definition);
  else context[name] = definition();
})('Firepad', function () {var firepad = firepad || { };
firepad.utils = { };

firepad.utils.makeEventEmitter = function(clazz, opt_allowedEVents) {
  clazz.prototype.allowedEvents_ = opt_allowedEVents;

  clazz.prototype.on = function(eventType, callback, context) {
    this.validateEventType_(eventType);
    this.eventListeners_ = this.eventListeners_ || { };
    this.eventListeners_[eventType] = this.eventListeners_[eventType] || [];
    this.eventListeners_[eventType].push({ callback: callback, context: context });
  };

  clazz.prototype.off = function(eventType, callback) {
    this.validateEventType_(eventType);
    this.eventListeners_ = this.eventListeners_ || { };
    var listeners = this.eventListeners_[eventType] || [];
    for(var i = 0; i < listeners.length; i++) {
      if (listeners[i].callback === callback) {
        listeners.splice(i, 1);
        return;
      }
    }
  };

  clazz.prototype.trigger =  function(eventType /*, args ... */) {
    this.eventListeners_ = this.eventListeners_ || { };
    var listeners = this.eventListeners_[eventType] || [];
    for(var i = 0; i < listeners.length; i++) {
      listeners[i].callback.apply(listeners[i].context, Array.prototype.slice.call(arguments, 1));
    }
  };

  clazz.prototype.validateEventType_ = function(eventType) {
    if (this.allowedEvents_) {
      var allowed = false;
      for(var i = 0; i < this.allowedEvents_.length; i++) {
        if (this.allowedEvents_[i] === eventType) {
          allowed = true;
          break;
        }
      }
      if (!allowed) {
        throw new Error('Unknown event "' + eventType + '"');
      }
    }
  };
};

firepad.utils.elt = function(tag, content, attrs) {
  var e = document.createElement(tag);
  if (typeof content === "string") {
    firepad.utils.setTextContent(e, content);
  } else if (content) {
    for (var i = 0; i < content.length; ++i) { e.appendChild(content[i]); }
  }
  for(var attr in (attrs || { })) {
    e.setAttribute(attr, attrs[attr]);
  }
  return e;
};

firepad.utils.setTextContent = function(e, str) {
  e.innerHTML = "";
  e.appendChild(document.createTextNode(str));
};


firepad.utils.on = function(emitter, type, f, capture) {
  if (emitter.addEventListener) {
    emitter.addEventListener(type, f, capture || false);
  } else if (emitter.attachEvent) {
    emitter.attachEvent("on" + type, f);
  }
};

firepad.utils.off = function(emitter, type, f, capture) {
  if (emitter.removeEventListener) {
    emitter.removeEventListener(type, f, capture || false);
  } else if (emitter.detachEvent) {
    emitter.detachEvent("on" + type, f);
  }
};

firepad.utils.preventDefault = function(e) {
  if (e.preventDefault) {
    e.preventDefault();
  } else {
    e.returnValue = false;
  }
};

firepad.utils.stopPropagation = function(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  } else {
    e.cancelBubble = true;
  }
};

firepad.utils.stopEvent = function(e) {
  firepad.utils.preventDefault(e);
  firepad.utils.stopPropagation(e);
};

firepad.utils.stopEventAnd = function(fn) {
  return function(e) {
    fn(e);
    firepad.utils.stopEvent(e);
    return false;
  };
};

firepad.utils.trim = function(str) {
  return str.replace(/^\s+/g, '').replace(/\s+$/g, '');
};

firepad.utils.stringEndsWith = function(str, suffix) {
  var list = (typeof suffix == 'string') ? [suffix] : suffix;
  for (var i = 0; i < list.length; i++) {
    var suffix = list[i];
    if (str.indexOf(suffix, str.length - suffix.length) !== -1) 
      return true;
  }
  return false;
};

firepad.utils.assert = function assert (b, msg) {
  if (!b) {
    throw new Error(msg || "assertion error");
  }
};

firepad.utils.log = function() {
  if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
    var args = ['Firepad:'];
    for(var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(console, args);
  }
};

var firepad = firepad || { };
firepad.Span = (function () {
  function Span(pos, length) {
    this.pos = pos;
    this.length = length;
  }

  Span.prototype.end = function() {
    return this.pos + this.length;
  };

  return Span;
}());
var firepad = firepad || { };

firepad.TextOp = (function() {
  var utils = firepad.utils;

  // Operation are essentially lists of ops. There are three types of ops:
  //
  // * Retain ops: Advance the cursor position by a given number of characters.
  //   Represented by positive ints.
  // * Insert ops: Insert a given string at the current cursor position.
  //   Represented by strings.
  // * Delete ops: Delete the next n characters. Represented by negative ints.
  function TextOp(type) {
    this.type = type;
    this.chars = null;
    this.text = null;
    this.attributes = null;

    if (type === 'insert') {
      this.text = arguments[1];
      utils.assert(typeof this.text === 'string');
      this.attributes = arguments[2] || { };
      utils.assert (typeof this.attributes === 'object');
    } else if (type === 'delete') {
      this.chars = arguments[1];
      utils.assert(typeof this.chars === 'number');
    } else if (type === 'retain') {
      this.chars = arguments[1];
      utils.assert(typeof this.chars === 'number');
      this.attributes = arguments[2] || { };
      utils.assert (typeof this.attributes === 'object');
    }
  }

  TextOp.prototype.isInsert = function() { return this.type === 'insert'; };
  TextOp.prototype.isDelete = function() { return this.type === 'delete'; };
  TextOp.prototype.isRetain = function() { return this.type === 'retain'; };

  TextOp.prototype.equals = function(other) {
    return (this.type === other.type &&
        this.text === other.text &&
        this.chars === other.chars &&
        this.attributesEqual(other.attributes));
  };

  TextOp.prototype.attributesEqual = function(otherAttributes) {
    for (var attr in this.attributes) {
      if (this.attributes[attr] !== otherAttributes[attr]) { return false; }
    }

    for (attr in otherAttributes) {
      if (this.attributes[attr] !== otherAttributes[attr]) { return false; }
    }

    return true;
  };

  TextOp.prototype.hasEmptyAttributes = function() {
    var empty = true;
    for (var attr in this.attributes) {
      empty = false;
      break;
    }

    return empty;
  };

  return TextOp;
})();

var firepad = firepad || { };

firepad.TextOperation = (function () {
  'use strict';
  var TextOp = firepad.TextOp;
  var utils = firepad.utils;

  // Constructor for new operations.
  function TextOperation () {
    if (!this || this.constructor !== TextOperation) {
      // => function was called without 'new'
      return new TextOperation();
    }

    // When an operation is applied to an input string, you can think of this as
    // if an imaginary cursor runs over the entire string and skips over some
    // parts, deletes some parts and inserts characters at some positions. These
    // actions (skip/delete/insert) are stored as an array in the "ops" property.
    this.ops = [];
    // An operation's baseLength is the length of every string the operation
    // can be applied to.
    this.baseLength = 0;
    // The targetLength is the length of every string that results from applying
    // the operation on a valid input string.
    this.targetLength = 0;
  }

  TextOperation.prototype.equals = function (other) {
    if (this.baseLength !== other.baseLength) { return false; }
    if (this.targetLength !== other.targetLength) { return false; }
    if (this.ops.length !== other.ops.length) { return false; }
    for (var i = 0; i < this.ops.length; i++) {
      if (!this.ops[i].equals(other.ops[i])) { return false; }
    }
    return true;
  };


  // After an operation is constructed, the user of the library can specify the
  // actions of an operation (skip/insert/delete) with these three builder
  // methods. They all return the operation for convenient chaining.

  // Skip over a given number of characters.
  TextOperation.prototype.retain = function (n, attributes) {
    if (typeof n !== 'number' || n < 0) {
      throw new Error("retain expects a positive integer.");
    }
    if (n === 0) { return this; }
    this.baseLength += n;
    this.targetLength += n;
    attributes = attributes || { };
    var prevOp = (this.ops.length > 0) ? this.ops[this.ops.length - 1] : null;
    if (prevOp && prevOp.isRetain() && prevOp.attributesEqual(attributes)) {
      // The last op is a retain op with the same attributes => we can merge them into one op.
      prevOp.chars += n;
    } else {
      // Create a new op.
      this.ops.push(new TextOp('retain', n, attributes));
    }
    return this;
  };

  // Insert a string at the current position.
  TextOperation.prototype.insert = function (str, attributes) {
    if (typeof str !== 'string') {
      throw new Error("insert expects a string");
    }
    if (str === '') { return this; }
    attributes = attributes || { };
    this.targetLength += str.length;
    var prevOp = (this.ops.length > 0) ? this.ops[this.ops.length - 1] : null;
    var prevPrevOp = (this.ops.length > 1) ? this.ops[this.ops.length - 2] : null;
    if (prevOp && prevOp.isInsert() && prevOp.attributesEqual(attributes)) {
      // Merge insert op.
      prevOp.text += str;
    } else if (prevOp && prevOp.isDelete()) {
      // It doesn't matter when an operation is applied whether the operation
      // is delete(3), insert("something") or insert("something"), delete(3).
      // Here we enforce that in this case, the insert op always comes first.
      // This makes all operations that have the same effect when applied to
      // a document of the right length equal in respect to the `equals` method.
      if (prevPrevOp && prevPrevOp.isInsert() && prevPrevOp.attributesEqual(attributes)) {
        prevPrevOp.text += str;
      } else {
        this.ops[this.ops.length - 1] = new TextOp('insert', str, attributes);
        this.ops.push(prevOp);
      }
    } else {
      this.ops.push(new TextOp('insert', str, attributes));
    }
    return this;
  };

  // Delete a string at the current position.
  TextOperation.prototype['delete'] = function (n) {
    if (typeof n === 'string') { n = n.length; }
    if (typeof n !== 'number' || n < 0) {
      throw new Error("delete expects a positive integer or a string");
    }
    if (n === 0) { return this; }
    this.baseLength += n;
    var prevOp = (this.ops.length > 0) ? this.ops[this.ops.length - 1] : null;
    if (prevOp && prevOp.isDelete()) {
      prevOp.chars += n;
    } else {
      this.ops.push(new TextOp('delete', n));
    }
    return this;
  };

  // Tests whether this operation has no effect.
  TextOperation.prototype.isNoop = function () {
    return this.ops.length === 0 ||
        (this.ops.length === 1 && (this.ops[0].isRetain() && this.ops[0].hasEmptyAttributes()));
  };

  TextOperation.prototype.clone = function() {
    var clone = new TextOperation();
    for(var i = 0; i < this.ops.length; i++) {
      if (this.ops[i].isRetain()) {
        clone.retain(this.ops[i].chars, this.ops[i].attributes);
      } else if (this.ops[i].isInsert()) {
        clone.insert(this.ops[i].text, this.ops[i].attributes);
      } else {
        clone['delete'](this.ops[i].chars);
      }
    }

    return clone;
  };

  // Pretty printing.
  TextOperation.prototype.toString = function () {
    // map: build a new array by applying a function to every element in an old
    // array.
    var map = Array.prototype.map || function (fn) {
      var arr = this;
      var newArr = [];
      for (var i = 0, l = arr.length; i < l; i++) {
        newArr[i] = fn(arr[i]);
      }
      return newArr;
    };
    return map.call(this.ops, function (op) {
      if (op.isRetain()) {
        return "retain " + op.chars;
      } else if (op.isInsert()) {
        return "insert '" + op.text + "'";
      } else {
        return "delete " + (op.chars);
      }
    }).join(', ');
  };

  // Converts operation into a JSON value.
  TextOperation.prototype.toJSON = function () {
    var ops = [];
    for(var i = 0; i < this.ops.length; i++) {
      // We prefix ops with their attributes if non-empty.
      if (!this.ops[i].hasEmptyAttributes()) {
        ops.push(this.ops[i].attributes);
      }
      if (this.ops[i].type === 'retain') {
        ops.push(this.ops[i].chars);
      } else if (this.ops[i].type === 'insert') {
        ops.push(this.ops[i].text);
      } else if (this.ops[i].type === 'delete') {
        ops.push(-this.ops[i].chars);
      }
    }
    // Return an array with /something/ in it, since an empty array will be treated as null by Firebase.
    if (ops.length === 0) {
      ops.push(0);
    }
    return ops;
  };

  // Converts a plain JS object into an operation and validates it.
  TextOperation.fromJSON = function (ops) {
    var o = new TextOperation();
    for (var i = 0, l = ops.length; i < l; i++) {
      var op = ops[i];
      var attributes = { };
      if (typeof op === 'object') {
        attributes = op;
        i++;
        op = ops[i];
      }
      if (typeof op === 'number') {
        if (op > 0) {
          o.retain(op, attributes);
        } else {
          o['delete'](-op);
        }
      } else {
        utils.assert(typeof op === 'string');
        o.insert(op, attributes);
      }
    }
    return o;
  };

  // Apply an operation to a string, returning a new string. Throws an error if
  // there's a mismatch between the input string and the operation.
  TextOperation.prototype.apply = function (str, oldAttributes, newAttributes) {
    var operation = this;
    oldAttributes = oldAttributes || [];
    newAttributes = newAttributes || [];
    if (str.length !== operation.baseLength) {
      throw new Error("The operation's base length must be equal to the string's length.");
    }
    var newStringParts = [], j = 0, k, attr;
    var oldIndex = 0;
    var ops = this.ops;
    for (var i = 0, l = ops.length; i < l; i++) {
      var op = ops[i];
      if (op.isRetain()) {
        if (oldIndex + op.chars > str.length) {
          throw new Error("Operation can't retain more characters than are left in the string.");
        }
        // Copy skipped part of the retained string.
        newStringParts[j++] = str.slice(oldIndex, oldIndex + op.chars);

        // Copy (and potentially update) attributes for each char in retained string.
        for(k = 0; k < op.chars; k++) {
          var currAttributes = oldAttributes[oldIndex + k] || { }, updatedAttributes = { };
          for(attr in currAttributes) {
            updatedAttributes[attr] = currAttributes[attr];
            utils.assert(updatedAttributes[attr] !== false);
          }
          for(attr in op.attributes) {
            if (op.attributes[attr] === false) {
              delete updatedAttributes[attr];
            } else {
              updatedAttributes[attr] = op.attributes[attr];
            }
            utils.assert(updatedAttributes[attr] !== false);
          }
          newAttributes.push(updatedAttributes);
        }

        oldIndex += op.chars;
      } else if (op.isInsert()) {
        // Insert string.
        newStringParts[j++] = op.text;

        // Insert attributes for each char.
        for(k = 0; k < op.text.length; k++) {
          var insertedAttributes = { };
          for(attr in op.attributes) {
            insertedAttributes[attr] = op.attributes[attr];
            utils.assert(insertedAttributes[attr] !== false);
          }
          newAttributes.push(insertedAttributes);
        }
      } else { // delete op
        oldIndex += op.chars;
      }
    }
    if (oldIndex !== str.length) {
      throw new Error("The operation didn't operate on the whole string.");
    }
    var newString = newStringParts.join('');
    utils.assert(newString.length === newAttributes.length);

    return newString;
  };

  // Computes the inverse of an operation. The inverse of an operation is the
  // operation that reverts the effects of the operation, e.g. when you have an
  // operation 'insert("hello "); skip(6);' then the inverse is 'delete("hello ");
  // skip(6);'. The inverse should be used for implementing undo.
  TextOperation.prototype.invert = function (str) {
    var strIndex = 0;
    var inverse = new TextOperation();
    var ops = this.ops;
    for (var i = 0, l = ops.length; i < l; i++) {
      var op = ops[i];
      if (op.isRetain()) {
        inverse.retain(op.chars);
        strIndex += op.chars;
      } else if (op.isInsert()) {
        inverse['delete'](op.text.length);
      } else { // delete op
        inverse.insert(str.slice(strIndex, strIndex + op.chars));
        strIndex += op.chars;
      }
    }
    return inverse;
  };

  // Compose merges two consecutive operations into one operation, that
  // preserves the changes of both. Or, in other words, for each input string S
  // and a pair of consecutive operations A and B,
  // apply(apply(S, A), B) = apply(S, compose(A, B)) must hold.
  TextOperation.prototype.compose = function (operation2) {
    var operation1 = this;
    if (operation1.targetLength !== operation2.baseLength) {
      throw new Error("The base length of the second operation has to be the target length of the first operation");
    }

    function composeAttributes(first, second, firstOpIsInsert) {
      var merged = { }, attr;
      for(attr in first) {
        merged[attr] = first[attr];
      }
      for(attr in second) {
        if (firstOpIsInsert && second[attr] === false) {
          delete merged[attr];
        } else {
          merged[attr] = second[attr];
        }
      }
      return merged;
    }

    var operation = new TextOperation(); // the combined operation
    var ops1 = operation1.clone().ops, ops2 = operation2.clone().ops;
    var i1 = 0, i2 = 0; // current index into ops1 respectively ops2
    var op1 = ops1[i1++], op2 = ops2[i2++]; // current ops
    var attributes;
    while (true) {
      // Dispatch on the type of op1 and op2
      if (typeof op1 === 'undefined' && typeof op2 === 'undefined') {
        // end condition: both ops1 and ops2 have been processed
        break;
      }

      if (op1 && op1.isDelete()) {
        operation['delete'](op1.chars);
        op1 = ops1[i1++];
        continue;
      }
      if (op2 && op2.isInsert()) {
        operation.insert(op2.text, op2.attributes);
        op2 = ops2[i2++];
        continue;
      }

      if (typeof op1 === 'undefined') {
        throw new Error("Cannot compose operations: first operation is too short.");
      }
      if (typeof op2 === 'undefined') {
        throw new Error("Cannot compose operations: first operation is too long.");
      }

      if (op1.isRetain() && op2.isRetain()) {
        attributes = composeAttributes(op1.attributes, op2.attributes);
        if (op1.chars > op2.chars) {
          operation.retain(op2.chars, attributes);
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          operation.retain(op1.chars, attributes);
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          operation.retain(op1.chars, attributes);
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
      } else if (op1.isInsert() && op2.isDelete()) {
        if (op1.text.length > op2.chars) {
          op1.text = op1.text.slice(op2.chars);
          op2 = ops2[i2++];
        } else if (op1.text.length === op2.chars) {
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          op2.chars -= op1.text.length;
          op1 = ops1[i1++];
        }
      } else if (op1.isInsert() && op2.isRetain()) {
        attributes = composeAttributes(op1.attributes, op2.attributes, /*firstOpIsInsert=*/true);
        if (op1.text.length > op2.chars) {
          operation.insert(op1.text.slice(0, op2.chars), attributes);
          op1.text = op1.text.slice(op2.chars);
          op2 = ops2[i2++];
        } else if (op1.text.length === op2.chars) {
          operation.insert(op1.text, attributes);
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          operation.insert(op1.text, attributes);
          op2.chars -= op1.text.length;
          op1 = ops1[i1++];
        }
      } else if (op1.isRetain() && op2.isDelete()) {
        if (op1.chars > op2.chars) {
          operation['delete'](op2.chars);
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          operation['delete'](op2.chars);
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          operation['delete'](op1.chars);
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
      } else {
        throw new Error(
          "This shouldn't happen: op1: " +
          JSON.stringify(op1) + ", op2: " +
          JSON.stringify(op2)
        );
      }
    }
    return operation;
  };

  function getSimpleOp (operation) {
    var ops = operation.ops;
    switch (ops.length) {
    case 1:
      return ops[0];
    case 2:
      return ops[0].isRetain() ? ops[1] : (ops[1].isRetain() ? ops[0] : null);
    case 3:
      if (ops[0].isRetain() && ops[2].isRetain()) { return ops[1]; }
    }
    return null;
  }

  function getStartIndex (operation) {
    if (operation.ops[0].isRetain()) { return operation.ops[0].chars; }
    return 0;
  }

  // When you use ctrl-z to undo your latest changes, you expect the program not
  // to undo every single keystroke but to undo your last sentence you wrote at
  // a stretch or the deletion you did by holding the backspace key down. This
  // This can be implemented by composing operations on the undo stack. This
  // method can help decide whether two operations should be composed. It
  // returns true if the operations are consecutive insert operations or both
  // operations delete text at the same position. You may want to include other
  // factors like the time since the last change in your decision.
  TextOperation.prototype.shouldBeComposedWith = function (other) {
    if (this.isNoop() || other.isNoop()) { return true; }

    var startA = getStartIndex(this), startB = getStartIndex(other);
    var simpleA = getSimpleOp(this), simpleB = getSimpleOp(other);
    if (!simpleA || !simpleB) { return false; }

    if (simpleA.isInsert() && simpleB.isInsert()) {
      return startA + simpleA.text.length === startB;
    }

    if (simpleA.isDelete() && simpleB.isDelete()) {
      // there are two possibilities to delete: with backspace and with the
      // delete key.
      return (startB + simpleB.chars === startA) || startA === startB;
    }

    return false;
  };

  // Decides whether two operations should be composed with each other
  // if they were inverted, that is
  // `shouldBeComposedWith(a, b) = shouldBeComposedWithInverted(b^{-1}, a^{-1})`.
  TextOperation.prototype.shouldBeComposedWithInverted = function (other) {
    if (this.isNoop() || other.isNoop()) { return true; }

    var startA = getStartIndex(this), startB = getStartIndex(other);
    var simpleA = getSimpleOp(this), simpleB = getSimpleOp(other);
    if (!simpleA || !simpleB) { return false; }

    if (simpleA.isInsert() && simpleB.isInsert()) {
      return startA + simpleA.text.length === startB || startA === startB;
    }

    if (simpleA.isDelete() && simpleB.isDelete()) {
      return startB + simpleB.chars === startA;
    }

    return false;
  };


  TextOperation.transformAttributes = function(attributes1, attributes2) {
    var attributes1prime = { }, attributes2prime = { };
    var attr, allAttrs = { };
    for(attr in attributes1) { allAttrs[attr] = true; }
    for(attr in attributes2) { allAttrs[attr] = true; }

    for (attr in allAttrs) {
      var attr1 = attributes1[attr], attr2 = attributes2[attr];
      utils.assert(attr1 != null || attr2 != null);
      if (attr1 == null) {
        // Only modified by attributes2; keep it.
        attributes2prime[attr] = attr2;
      } else if (attr2 == null) {
        // only modified by attributes1; keep it
        attributes1prime[attr] = attr1;
      } else if (attr1 === attr2) {
        // Both set it to the same value.  Nothing to do.
      } else {
        // attr1 and attr2 are different. Prefer attr1.
        attributes1prime[attr] = attr1;
      }
    }
    return [attributes1prime, attributes2prime];
  };

  // Transform takes two operations A and B that happened concurrently and
  // produces two operations A' and B' (in an array) such that
  // `apply(apply(S, A), B') = apply(apply(S, B), A')`. This function is the
  // heart of OT.
  TextOperation.transform = function (operation1, operation2) {
    if (operation1.baseLength !== operation2.baseLength) {
      throw new Error("Both operations have to have the same base length");
    }

    var operation1prime = new TextOperation();
    var operation2prime = new TextOperation();
    var ops1 = operation1.clone().ops, ops2 = operation2.clone().ops;
    var i1 = 0, i2 = 0;
    var op1 = ops1[i1++], op2 = ops2[i2++];
    while (true) {
      // At every iteration of the loop, the imaginary cursor that both
      // operation1 and operation2 have that operates on the input string must
      // have the same position in the input string.

      if (typeof op1 === 'undefined' && typeof op2 === 'undefined') {
        // end condition: both ops1 and ops2 have been processed
        break;
      }

      // next two cases: one or both ops are insert ops
      // => insert the string in the corresponding prime operation, skip it in
      // the other one. If both op1 and op2 are insert ops, prefer op1.
      if (op1 && op1.isInsert()) {
        operation1prime.insert(op1.text, op1.attributes);
        operation2prime.retain(op1.text.length);
        op1 = ops1[i1++];
        continue;
      }
      if (op2 && op2.isInsert()) {
        operation1prime.retain(op2.text.length);
        operation2prime.insert(op2.text, op2.attributes);
        op2 = ops2[i2++];
        continue;
      }

      if (typeof op1 === 'undefined') {
        throw new Error("Cannot transform operations: first operation is too short.");
      }
      if (typeof op2 === 'undefined') {
        throw new Error("Cannot transform operations: first operation is too long.");
      }

      var minl;
      if (op1.isRetain() && op2.isRetain()) {
        // Simple case: retain/retain
        var attributesPrime = TextOperation.transformAttributes(op1.attributes, op2.attributes);
        if (op1.chars > op2.chars) {
          minl = op2.chars;
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          minl = op2.chars;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1.chars;
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }

        operation1prime.retain(minl, attributesPrime[0]);
        operation2prime.retain(minl, attributesPrime[1]);
      } else if (op1.isDelete() && op2.isDelete()) {
        // Both operations delete the same string at the same position. We don't
        // need to produce any operations, we just skip over the delete ops and
        // handle the case that one operation deletes more than the other.
        if (op1.chars > op2.chars) {
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
      // next two cases: delete/retain and retain/delete
      } else if (op1.isDelete() && op2.isRetain()) {
        if (op1.chars > op2.chars) {
          minl = op2.chars;
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          minl = op2.chars;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1.chars;
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
        operation1prime['delete'](minl);
      } else if (op1.isRetain() && op2.isDelete()) {
        if (op1.chars > op2.chars) {
          minl = op2.chars;
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          minl = op1.chars;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1.chars;
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
        operation2prime['delete'](minl);
      } else {
        throw new Error("The two operations aren't compatible");
      }
    }

    return [operation1prime, operation2prime];
  };

  return TextOperation;
}());

var firepad = firepad || { };

// TODO: Rewrite this (probably using a splay tree) to be efficient.  Right now it's based on a linked list
// so all operations are O(n), where n is the number of spans in the list.
firepad.AnnotationList = (function () {
  var Span = firepad.Span;

  function assert(bool, text) {
    if (!bool) {
      throw new Error('AnnotationList assertion failed' + (text ? (': ' + text) : ''));
    }
  }

  function OldAnnotatedSpan(pos, node) {
    this.pos = pos;
    this.length = node.length;
    this.annotation = node.annotation;
    this.attachedObject_ = node.attachedObject;
  }

  OldAnnotatedSpan.prototype.getAttachedObject = function() {
    return this.attachedObject_;
  };

  function NewAnnotatedSpan(pos, node) {
    this.pos = pos;
    this.length = node.length;
    this.annotation = node.annotation;
    this.node_ = node;
  }

  NewAnnotatedSpan.prototype.attachObject = function(object) {
    this.node_.attachedObject = object;
  };

  var NullAnnotation = { equals: function() { return false; } };

  function AnnotationList(changeHandler) {
    // There's always a head node; to avoid special cases.
    this.head_ = new Node(0, NullAnnotation);
    this.changeHandler_ = changeHandler;
  }

  AnnotationList.prototype.insertAnnotatedSpan = function(span, annotation) {
    this.wrapOperation_(new Span(span.pos, 0), function(oldPos, old) {
      assert(!old || old.next === null); // should be 0 or 1 nodes.
      var toInsert = new Node(span.length, annotation);
      if (!old) {
        return toInsert;
      } else {
        assert (span.pos > oldPos && span.pos < oldPos + old.length);
        var newNodes = new Node(0, NullAnnotation);
        // Insert part of old before insertion point.
        newNodes.next = new Node(span.pos - oldPos, old.annotation);
        // Insert new node.
        newNodes.next.next = toInsert;
        // Insert part of old after insertion point.
        toInsert.next = new Node(oldPos + old.length - span.pos, old.annotation);
        return newNodes.next;
      }
    });
  };

  AnnotationList.prototype.removeSpan = function(removeSpan) {
    if (removeSpan.length === 0) { return; }

    this.wrapOperation_(removeSpan, function(oldPos, old) {
      assert (old !== null);
      var newNodes = new Node(0, NullAnnotation), current = newNodes;
      // Add new node for part before the removed span (if any).
      if (removeSpan.pos > oldPos) {
        current.next = new Node(removeSpan.pos - oldPos, old.annotation);
        current = current.next;
      }

      // Skip over removed nodes.
      while (removeSpan.end() > oldPos + old.length) {
        oldPos += old.length;
        old = old.next;
      }

      // Add new node for part after the removed span (if any).
      var afterChars = oldPos + old.length - removeSpan.end();
      if (afterChars > 0) {
        current.next = new Node(afterChars, old.annotation);
      }

      return newNodes.next;
    });
  };

  AnnotationList.prototype.updateSpan = function (span, updateFn) {
    if (span.length === 0) { return; }

    this.wrapOperation_(span, function(oldPos, old) {
      assert (old !== null);
      var newNodes = new Node(0, NullAnnotation), current = newNodes, currentPos = oldPos;

      // Add node for any characters before the span we're updating.
      var beforeChars = span.pos - currentPos;
      assert(beforeChars < old.length);
      if (beforeChars > 0) {
        current.next = new Node(beforeChars, old.annotation);
        current = current.next;
        currentPos += current.length;
      }

      // Add updated nodes for entirely updated nodes.
      while (old !== null && span.end() >= oldPos + old.length) {
        var length = oldPos + old.length - currentPos;
        current.next = new Node(length, updateFn(old.annotation, length));
        current = current.next;
        oldPos += old.length;
        old = old.next;
        currentPos = oldPos;
      }

      // Add updated nodes for last node.
      var updateChars = span.end() - currentPos;
      if (updateChars > 0) {
        assert(updateChars < old.length);
        current.next = new Node(updateChars, updateFn(old.annotation, updateChars));
        current = current.next;
        currentPos += current.length;

        // Add non-updated remaining part of node.
        current.next = new Node(oldPos + old.length - currentPos, old.annotation);
      }

      return newNodes.next;
    });
  };

  AnnotationList.prototype.wrapOperation_ = function(span, operationFn) {
    if (span.pos < 0) {
      throw new Error('Span start cannot be negative.');
    }
    var oldNodes = [], newNodes = [];

    var res = this.getAffectedNodes_(span);

    var tail;
    if (res.start !== null) {
      tail = res.end.next;
      // Temporarily truncate list so we can pass it to operationFn.  We'll splice it back in later.
      res.end.next = null;
    } else {
      // start and end are null, because span is empty and lies on the border of two nodes.
      tail = res.succ;
    }

    // Create a new segment to replace the affected nodes.
    var newSegment = operationFn(res.startPos, res.start);

    var includePredInOldNodes = false, includeSuccInOldNodes = false;
    if (newSegment) {
      this.mergeNodesWithSameAnnotations_(newSegment);

      var newPos;
      if (res.pred && res.pred.annotation.equals(newSegment.annotation)) {
        // We can merge the pred node with newSegment's first node.
        includePredInOldNodes = true;
        newSegment.length += res.pred.length;

        // Splice newSegment in after beforePred.
        res.beforePred.next = newSegment;
        newPos = res.predPos;
      } else {
        // Splice newSegment in after beforeStart.
        res.beforeStart.next = newSegment;
        newPos = res.startPos;
      }

      // Generate newNodes, but not the last one (since we may be able to merge it with succ).
      while(newSegment.next) {
        newNodes.push(new NewAnnotatedSpan(newPos, newSegment));
        newPos += newSegment.length;
        newSegment = newSegment.next;
      }

      if (res.succ && res.succ.annotation.equals(newSegment.annotation)) {
        // We can merge newSegment's last node with the succ node.
        newSegment.length += res.succ.length;
        includeSuccInOldNodes = true;

        // Splice rest of list after succ after newSegment.
        newSegment.next = res.succ.next;
      } else {
        // Splice tail after newSegment.
        newSegment.next = tail;
      }

      // Add last newSegment node to newNodes.
      newNodes.push(new NewAnnotatedSpan(newPos, newSegment));

    } else {
      // newList is empty.  Try to merge pred and succ.
      if (res.pred && res.succ && res.pred.annotation.equals(res.succ.annotation)) {
        includePredInOldNodes = true;
        includeSuccInOldNodes = true;

        // Create succ + pred merged node and splice list together.
        newSegment = new Node(res.pred.length + res.succ.length, res.pred.annotation);
        res.beforePred.next = newSegment;
        newSegment.next = res.succ.next;

        newNodes.push(new NewAnnotatedSpan(res.startPos - res.pred.length, newSegment));
      } else {
        // Just splice list back together.
        res.beforeStart.next = tail;
      }
    }

    // Build list of oldNodes.

    if (includePredInOldNodes) {
      oldNodes.push(new OldAnnotatedSpan(res.predPos, res.pred));
    }

    var oldPos = res.startPos, oldSegment = res.start;
    while (oldSegment !== null) {
      oldNodes.push(new OldAnnotatedSpan(oldPos, oldSegment));
      oldPos += oldSegment.length;
      oldSegment = oldSegment.next;
    }

    if (includeSuccInOldNodes) {
      oldNodes.push(new OldAnnotatedSpan(oldPos, res.succ));
    }

    this.changeHandler_(oldNodes, newNodes);
  };

  AnnotationList.prototype.getAffectedNodes_ = function(span) {
    // We want to find nodes 'start', 'end', 'beforeStart', 'pred', and 'succ' where:
    //  - 'start' contains the first character in span.
    //  - 'end' contains the last character in span.
    //  - 'beforeStart' is the node before 'start'.
    //  - 'beforePred' is the node before 'pred'.
    //  - 'succ' contains the node after 'end' if span.end() was on a node boundary, else null.
    //  - 'pred' contains the node before 'start' if span.pos was on a node boundary, else null.

    var result = {};

    var prevprev = null, prev = this.head_, current = prev.next, currentPos = 0;
    while (current !== null && span.pos >= currentPos + current.length) {
      currentPos += current.length;
      prevprev = prev;
      prev = current;
      current = current.next;
    }
    if (current === null && !(span.length === 0 && span.pos === currentPos)) {
      throw new Error('Span start exceeds the bounds of the AnnotationList.');
    }

    result.startPos = currentPos;
    // Special case if span is empty and on the border of two nodes
    if (span.length === 0 && span.pos === currentPos) {
      result.start = null;
    } else {
      result.start = current;
    }
    result.beforeStart = prev;

    if (currentPos === span.pos && currentPos > 0) {
      result.pred = prev;
      result.predPos = currentPos - prev.length;
      result.beforePred = prevprev;
    } else {
      result.pred = null;
    }

    while (current !== null && span.end() > currentPos) {
      currentPos += current.length;
      prev = current;
      current = current.next;
    }
    if (span.end() > currentPos) {
      throw new Error('Span end exceeds the bounds of the AnnotationList.');
    }

    // Special case if span is empty and on the border of two nodes.
    if (span.length === 0 && span.end() === currentPos) {
      result.end = null;
    } else {
      result.end = prev;
    }
    result.succ = (currentPos === span.end()) ? current : null;

    return result;
  };

  AnnotationList.prototype.mergeNodesWithSameAnnotations_ = function(list) {
    if (!list) { return; }
    var prev = null, curr = list;
    while (curr) {
      if (prev && prev.annotation.equals(curr.annotation)) {
        prev.length += curr.length;
        prev.next = curr.next;
      } else {
        prev = curr;
      }
      curr = curr.next;
    }
  };

  AnnotationList.prototype.forEach = function(callback) {
    var current = this.head_.next;
    while (current !== null) {
      callback(current.length, current.annotation, current.attachedObject);
      current = current.next;
    }
  };

  AnnotationList.prototype.getAnnotatedSpansForPos = function(pos) {
    var currentPos = 0;
    var current = this.head_.next, prev = null;
    while (current !== null && currentPos + current.length <= pos) {
      currentPos += current.length;
      prev = current;
      current = current.next;
    }
    if (current === null && currentPos !== pos) {
      throw new Error('pos exceeds the bounds of the AnnotationList');
    }

    var res = [];
    if (currentPos === pos && prev) {
      res.push(new OldAnnotatedSpan(currentPos - prev.length, prev));
    }
    if (current) {
      res.push(new OldAnnotatedSpan(currentPos, current));
    }
    return res;
  };

  AnnotationList.prototype.getAnnotatedSpansForSpan = function(span) {
    if (span.length === 0) {
      return [];
    }
    var oldSpans = [];
    var res = this.getAffectedNodes_(span);
    var currentPos = res.startPos, current = res.start;
    while (current !== null && currentPos < span.end()) {
      var start = Math.max(currentPos, span.pos), end = Math.min(currentPos + current.length, span.end());
      var oldSpan = new Span(start, end - start);
      oldSpan.annotation = current.annotation;
      oldSpans.push(oldSpan);

      currentPos += current.length;
      current = current.next;
    }
    return oldSpans;
  };

  // For testing.
  AnnotationList.prototype.count = function() {
    var count = 0;
    var current = this.head_.next, prev = null;
    while(current !== null) {
      if (prev) {
        assert(!prev.annotation.equals(current.annotation));
      }
      prev = current;
      current = current.next;
      count++;
    }
    return count;
  };

  function Node(length, annotation) {
    this.length = length;
    this.annotation = annotation;
    this.attachedObject = null;
    this.next = null;
  }

  Node.prototype.clone = function() {
    var node = new Node(this.spanLength, this.annotation);
    node.next = this.next;
    return node;
  };

  return AnnotationList;
}());
var firepad = firepad || { };
firepad.Cursor = (function () {
  'use strict';

  // A cursor has a `position` and a `selectionEnd`. Both are zero-based indexes
  // into the document. When nothing is selected, `selectionEnd` is equal to
  // `position`. When there is a selection, `position` is always the side of the
  // selection that would move if you pressed an arrow key.
  function Cursor (position, selectionEnd) {
    this.position = position;
    this.selectionEnd = selectionEnd;
  }

  Cursor.fromJSON = function (obj) {
    return new Cursor(obj.position, obj.selectionEnd);
  };

  Cursor.prototype.equals = function (other) {
    return this.position === other.position &&
      this.selectionEnd === other.selectionEnd;
  };

  // Return the more current cursor information.
  Cursor.prototype.compose = function (other) {
    return other;
  };

  // Update the cursor with respect to an operation.
  Cursor.prototype.transform = function (other) {
    function transformIndex (index) {
      var newIndex = index;
      var ops = other.ops;
      for (var i = 0, l = other.ops.length; i < l; i++) {
        if (ops[i].isRetain()) {
          index -= ops[i].chars;
        } else if (ops[i].isInsert()) {
          newIndex += ops[i].text.length;
        } else {
          newIndex -= Math.min(index, ops[i].chars);
          index -= ops[i].chars;
        }
        if (index < 0) { break; }
      }
      return newIndex;
    }

    var newPosition = transformIndex(this.position);
    if (this.position === this.selectionEnd) {
      return new Cursor(newPosition, newPosition);
    }
    return new Cursor(newPosition, transformIndex(this.selectionEnd));
  };

  return Cursor;

}());


var firepad = firepad || { };

firepad.FirebaseAdapter = (function (global) {
  var TextOperation = firepad.TextOperation;
  var utils = firepad.utils;

  // Save a checkpoint every 100 edits.
  var CHECKPOINT_FREQUENCY = 100;

  function FirebaseAdapter (ref, userId, userColor) {
    this.ref_ = ref;
    this.ready_ = false;
    this.firebaseCallbacks_ = [];
    this.zombie_ = false;

    // We store the current document state as a TextOperation so we can write checkpoints to Firebase occasionally.
    // TODO: Consider more efficient ways to do this. (composing text operations is ~linear in the length of the document).
    this.document_ = new TextOperation();

    // The next expected revision.
    this.revision_ = 0;

    // This is used for two purposes:
    // 1) On initialization, we fill this with the latest checkpoint and any subsequent operations and then
    //      process them all together.
    // 2) If we ever receive revisions out-of-order (e.g. rev 5 before rev 4), we queue them here until it's time
    //    for them to be handled. [this should never happen with well-behaved clients; but if it /does/ happen we want
    //    to handle it gracefully.]
    this.pendingReceivedRevisions_ = { };

    this.setUserId(userId);
    this.setColor(userColor);

    var self = this;
    this.firebaseOn_(ref.root().child('.info/connected'), 'value', function(snapshot) {
      if (snapshot.val() === true) {
        self.initializeUserData_();
      }
    }, this);

    // Avoid triggering any events until our callers have had a chance to attach their listeners.
    setTimeout(function() {
      self.monitorHistory_();
    }, 0);

    // Once we're initialized, start tracking users' cursors.
    this.on('ready', function() {
      self.monitorCursors_();
    });

  }
  utils.makeEventEmitter(FirebaseAdapter, ['ready', 'cursor', 'operation', 'ack', 'retry']);

  FirebaseAdapter.prototype.dispose = function() {
    this.removeFirebaseCallbacks_();

    this.userRef_.child('cursor').remove();
    this.userRef_.child('color').remove();

    this.ref_ = null;
    this.document_ = null;
    this.zombie_ = true;
  };

  FirebaseAdapter.prototype.setUserId = function(userId) {
    if (this.userRef_) {
      // clean up existing data.
      this.userRef_.child('cursor').remove();
      this.userRef_.child('cursor').onDisconnect().cancel();
      this.userRef_.child('color').remove();
      this.userRef_.child('color').onDisconnect().cancel();
    }

    this.userId_ = userId;
    this.userRef_ = this.ref_.child('users').child(userId);

    this.initializeUserData_();
  };

  FirebaseAdapter.prototype.isHistoryEmpty = function() {
    assert(this.ready_, "Not ready yet.");
    return this.revision_ === 0;
  };

  FirebaseAdapter.prototype.sendOperation = function (operation, cursor) {
    var self = this;

    // If we're not ready yet, do nothing right now, and trigger a retry when we're ready.
    if (!this.ready_) {
      this.on('ready', function() {
        self.trigger('retry');
      });
      return;
    }

    // Sanity check that this operation is valid.
    assert(this.document_.targetLength === operation.baseLength, "sendOperation() called with invalid operation.");

    // Convert revision into an id that will sort properly lexicographically.
    var revisionId = revisionToId(this.revision_);

    function doTransaction(revisionId, revisionData, cursor) {
      self.ref_.child('history').child(revisionId).transaction(function(current) {
        if (current === null) {
          return revisionData;
        }
      }, function(error, committed) {
        if (error) {
          if (error.message === 'disconnect') {
            if (self.sent_ && self.sent_.id === revisionId) {
              // We haven't seen our transaction succeed or fail.  Send it again.
              setTimeout(function() {
                doTransaction(revisionId, revisionData, cursor);
              }, 0);
            }
          } else {
            utils.log('Transaction failure!', error);
            throw error;
          }
        } else if (committed) {
          self.sendCursor(cursor);
        }
      }, /*applyLocally=*/false);
    }

    this.sent_ = { id: revisionId, op: operation };
    doTransaction(revisionId, { a: self.userId_, o: operation.toJSON(), t: Firebase.ServerValue.TIMESTAMP }, cursor);
  };

  FirebaseAdapter.prototype.sendCursor = function (obj) {
    this.userRef_.child('cursor').set(obj);
    this.cursor_ = obj;
  };

  FirebaseAdapter.prototype.setColor = function(color) {
    this.userRef_.child('color').set(color);
    this.color_ = color;
  };

  FirebaseAdapter.prototype.getDocument = function() {
    return this.document_;
  };

  FirebaseAdapter.prototype.registerCallbacks = function(callbacks) {
    for (var eventType in callbacks) {
      this.on(eventType, callbacks[eventType]);
    }
  };

  FirebaseAdapter.prototype.initializeUserData_ = function() {
    this.userRef_.child('cursor').onDisconnect().remove();
    this.userRef_.child('color').onDisconnect().remove();

    this.sendCursor(this.cursor_ || null);
    this.setColor(this.color_ || null);
  };

  FirebaseAdapter.prototype.monitorCursors_ = function() {
    var usersRef = this.ref_.child('users'), self = this;
    var user2Callback = { };

    function childChanged(childSnap) {
      var userId = childSnap.name();
      var userData = childSnap.val();
      self.trigger('cursor', userId, userData.cursor, userData.color);
    }

    this.firebaseOn_(usersRef, 'child_added', childChanged);
    this.firebaseOn_(usersRef, 'child_changed', childChanged);

    this.firebaseOn_(usersRef, 'child_removed', function(childSnap) {
      var userId = childSnap.name();
      self.firebaseOff_(childSnap.ref(), 'value', user2Callback[userId]);
      self.trigger('cursor', userId, null);
    });
  };

  FirebaseAdapter.prototype.monitorHistory_ = function() {
    var self = this;
    // Get the latest checkpoint as a starting point so we don't have to re-play entire history.
    this.ref_.child('checkpoint').once('value', function(s) {
      if (self.zombie_) { return; } // just in case we were cleaned up before we got the checkpoint data.
      var revisionId = s.child('id').val(),  op = s.child('o').val(), author = s.child('a').val();
      if (op != null && revisionId != null && author !== null) {
        self.pendingReceivedRevisions_[revisionId] = { o: op, a: author };
        self.checkpointRevision_ = revisionFromId(revisionId);
        self.monitorHistoryStartingAt_(self.checkpointRevision_ + 1);
      } else {
        self.checkpointRevision_ = 0;
        self.monitorHistoryStartingAt_(self.checkpointRevision_);
      }
    });
  };

  FirebaseAdapter.prototype.monitorHistoryStartingAt_ = function(revision) {
    var historyRef = this.ref_.child('history').startAt(null, revisionToId(revision));
    var self = this;

    setTimeout(function() {
      self.firebaseOn_(historyRef, 'child_added', function(revisionSnapshot) {
        var revisionId = revisionSnapshot.name();
        self.pendingReceivedRevisions_[revisionId] = revisionSnapshot.val();
        if (self.ready_) {
          self.handlePendingReceivedRevisions_();
        }
      });

      historyRef.once('value', function() {
        self.handleInitialRevisions_();
      });
    }, 0);
  };

  FirebaseAdapter.prototype.handleInitialRevisions_ = function() {
    assert(!this.ready_, "Should not be called multiple times.");

    // Compose the checkpoint and all subsequent revisions into a single operation to apply at once.
    this.revision_ = this.checkpointRevision_;
    var revisionId = revisionToId(this.revision_), pending = this.pendingReceivedRevisions_;
    while (pending[revisionId] != null) {
      var revision = this.parseRevision_(pending[revisionId]);
      if (!revision) {
        // If a misbehaved client adds a bad operation, just ignore it.
        utils.log('Invalid operation.', this.ref_.toString(), revisionId, pending[revisionId]);
      } else {
        this.document_ = this.document_.compose(revision.operation);
      }

      delete pending[revisionId];
      this.revision_++;
      revisionId = revisionToId(this.revision_);
    }

    this.trigger('operation', this.document_);

    this.ready_ = true;
    var self = this;
    setTimeout(function() {
      self.trigger('ready');
    }, 0);
  };

  FirebaseAdapter.prototype.handlePendingReceivedRevisions_ = function() {
    var pending = this.pendingReceivedRevisions_;
    var revisionId = revisionToId(this.revision_);
    var triggerRetry = false;
    while (pending[revisionId] != null) {
      this.revision_++;

      var revision = this.parseRevision_(pending[revisionId]);
      if (!revision) {
        // If a misbehaved client adds a bad operation, just ignore it.
        utils.log('Invalid operation.', this.ref_.toString(), revisionId, pending[revisionId]);
      } else {
        this.document_ = this.document_.compose(revision.operation);
        if (this.sent_ && revisionId === this.sent_.id) {
          // We have an outstanding change at this revision id.
          if (this.sent_.op.equals(revision.operation) && revision.author === this.userId_) {
            // This is our change; it succeeded.
            if (this.revision_ % CHECKPOINT_FREQUENCY === 0) {
              this.saveCheckpoint_();
            }
            this.sent_ = null;
            this.trigger('ack');
          } else {
            // our op failed.  Trigger a retry after we're done catching up on any incoming ops.
            triggerRetry = true;
            this.trigger('operation', revision.operation);
          }
        } else {
          this.trigger('operation', revision.operation);
        }
      }
      delete pending[revisionId];

      revisionId = revisionToId(this.revision_);
    }

    if (triggerRetry) {
      this.sent_ = null;
      this.trigger('retry');
    }
  };

  FirebaseAdapter.prototype.parseRevision_ = function(data) {
    // We could do some of this validation via security rules.  But it's nice to be robust, just in case.
    if (typeof data !== 'object') { return null; }
    if (typeof data.a !== 'string' || typeof data.o !== 'object') { return null; }
    var op = null;
    try {
      op = TextOperation.fromJSON(data.o);
    }
    catch (e) {
      return null;
    }

    if (op.baseLength !== this.document_.targetLength) {
      return null;
    }
    return { author: data.a, operation: op }
  };

  FirebaseAdapter.prototype.saveCheckpoint_ = function() {
    this.ref_.child('checkpoint').set({
      a: this.userId_,
      o: this.document_.toJSON(),
      id: revisionToId(this.revision_ - 1) // use the id for the revision we just wrote.
    });
  };

  FirebaseAdapter.prototype.firebaseOn_ = function(ref, eventType, callback, context) {
    this.firebaseCallbacks_.push({ref: ref, eventType: eventType, callback: callback, context: context });
    ref.on(eventType, callback, context);
    return callback;
  };

  FirebaseAdapter.prototype.firebaseOff_ = function(ref, eventType, callback, context) {
    ref.off(eventType, callback, context);
    for(var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      if (l.ref === ref && l.eventType === eventType && l.callback === callback && l.context === context) {
        this.firebaseCallbacks_.splice(i, 1);
        break;
      }
    }
  };

  FirebaseAdapter.prototype.removeFirebaseCallbacks_ = function() {
    for(var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      l.ref.off(l.eventType, l.callback, l.context);
    }
    this.firebaseCallbacks_ = [];
  };

  // Throws an error if the first argument is falsy. Useful for debugging.
  function assert (b, msg) {
    if (!b) {
      throw new Error(msg || "assertion error");
    }
  }

  // Based off ideas from http://www.zanopha.com/docs/elen.pdf
  var characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  function revisionToId(revision) {
    if (revision === 0) {
      return 'A0';
    }

    var str = '';
    while (revision > 0) {
      var digit = (revision % characters.length);
      str = characters[digit] + str;
      revision -= digit;
      revision /= characters.length;
    }

    // Prefix with length (starting at 'A' for length 1) to ensure the id's sort lexicographically.
    var prefix = characters[str.length + 9];
    return prefix + str;
  }

  function revisionFromId(revisionId) {
    assert (revisionId.length > 0 && revisionId[0] === characters[revisionId.length + 8]);
    var revision = 0;
    for(var i = 1; i < revisionId.length; i++) {
      revision *= characters.length;
      revision += characters.indexOf(revisionId[i]);
    }
    return revision;
  }

  return FirebaseAdapter;
}());

var firepad = firepad || { };

firepad.RichTextToolbar = (function(global) {
  var utils = firepad.utils;

  function RichTextToolbar(imageInsertionUI) {
    this.imageInsertionUI = imageInsertionUI;
    this.element_ = this.makeElement_();
  }

  utils.makeEventEmitter(RichTextToolbar, ['bold', 'italic', 'underline', 'strike', 'font', 'font-size', 'color',
    'left', 'center', 'right', 'unordered-list', 'ordered-list', 'todo-list', 'indent-increase', 'indent-decrease',
                                           'undo', 'redo', 'insert-image']);

  RichTextToolbar.prototype.element = function() { return this.element_; };

  RichTextToolbar.prototype.makeButton_ = function(eventName, iconName) {
    var self = this;
    iconName = iconName || eventName;
    var btn = utils.elt('a', [utils.elt('span', '', { 'class': 'firepad-tb-' + iconName } )], { 'class': 'firepad-btn' });
    utils.on(btn, 'click', utils.stopEventAnd(function() { self.trigger(eventName); }));
    return btn;
  }

  RichTextToolbar.prototype.makeElement_ = function() {
    var self = this;

    var font = this.makeFontDropdown_();
    var fontSize = this.makeFontSizeDropdown_();
    var color = this.makeColorDropdown_();

    var toolbarOptions = [utils.elt('div', [font], { 'class': 'firepad-btn-group'}),
                          utils.elt('div', [fontSize], { 'class': 'firepad-btn-group'}),
                          utils.elt('div', [color], { 'class': 'firepad-btn-group'}),
                          utils.elt('div', [self.makeButton_('bold'), self.makeButton_('italic'), self.makeButton_('underline'), self.makeButton_('strike', 'strikethrough')], { 'class': 'firepad-btn-group'}),
                          utils.elt('div', [self.makeButton_('unordered-list', 'list-2'), self.makeButton_('ordered-list', 'numbered-list'), self.makeButton_('todo-list', 'list')], { 'class': 'firepad-btn-group'}),
                          utils.elt('div', [self.makeButton_('indent-decrease'), self.makeButton_('indent-increase')], { 'class': 'firepad-btn-group'}),
                          utils.elt('div', [self.makeButton_('left', 'paragraph-left'), self.makeButton_('center', 'paragraph-center'), self.makeButton_('right', 'paragraph-right')], { 'class': 'firepad-btn-group'}),
                          // Hide undo/redo for now, since they make the toolbar wrap on the firepad.io demo.  Should look into making the                                                                                   
                          // toolbar more compact.                                                                                                                                                                                   
                          /*utils.elt('div', [self.makeButton_('undo'), self.makeButton_('redo')], { 'class': 'firepad-btn-group'}) */
                          ];

    if (self.imageInsertionUI)
        toolbarOptions.push(utils.elt('div', [self.makeButton_('insert-image')], { 'class': 'firepad-btn-group' }));

    var toolbar = utils.elt('div', toolbarOptions , { 'class': 'firepad-toolbar' });

    return toolbar;
  };

  RichTextToolbar.prototype.makeFontDropdown_ = function() {
    // NOTE: There must be matching .css styles in firepad.css.
    var fonts = ['Arial', 'Comic Sans MS', 'Courier New', 'Impact', 'Times New Roman', 'Verdana'];

    var items = [];
    for(var i = 0; i < fonts.length; i++) {
      var content = utils.elt('span', fonts[i]);
      content.setAttribute('style', 'font-family:' + fonts[i]);
      items.push({ content: content, value: fonts[i] });
    }
    return this.makeDropdown_('Font', 'font', items);
  };

  RichTextToolbar.prototype.makeFontSizeDropdown_ = function() {
    // NOTE: There must be matching .css styles in firepad.css.
    var sizes = [9, 10, 12, 14, 18, 24, 32, 42];

    var items = [];
    for(var i = 0; i < sizes.length; i++) {
      var content = utils.elt('span', sizes[i].toString());
      content.setAttribute('style', 'font-size:' + sizes[i] + 'px; line-height:' + (sizes[i]-6) + 'px;');
      items.push({ content: content, value: sizes[i] });
    }
    return this.makeDropdown_('Size', 'font-size', items, 'px');
  };

  RichTextToolbar.prototype.makeColorDropdown_ = function() {
    var colors = ['black', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'grey'];

    var items = [];
    for(var i = 0; i < colors.length; i++) {
      var content = utils.elt('div');
      content.className = 'firepad-color-dropdown-item';
      content.setAttribute('style', 'background-color:' + colors[i]);
      items.push({ content: content, value: colors[i] });
    }
    return this.makeDropdown_('Color', 'color', items);
  };

  RichTextToolbar.prototype.makeDropdown_ = function(title, eventName, items, value_suffix) {
    value_suffix = value_suffix || "";
    var self = this;
    var button = utils.elt('a', title + ' \u25be', { 'class': 'firepad-btn firepad-dropdown' });
    var list = utils.elt('ul', [ ], { 'class': 'firepad-dropdown-menu' });
    button.appendChild(list);

    var isShown = false;
    function showDropdown() {
      if (!isShown) {
        list.style.display = 'block';
        utils.on(document, 'click', hideDropdown, /*capture=*/true);
        isShown = true;
      }
    }

    var justDismissed = false;
    function hideDropdown() {
      if (isShown) {
        list.style.display = '';
        utils.off(document, 'click', hideDropdown, /*capture=*/true);
        isShown = false;
      }
      // HACK so we can avoid re-showing the dropdown if you click on the dropdown header to dismiss it.
      justDismissed = true;
      setTimeout(function() { justDismissed = false; }, 0);
    }

    function addItem(content, value) {
      if (typeof content !== 'object') {
        content = document.createTextNode(String(content));
      }
      var element = utils.elt('a', [content]);

      utils.on(element, 'click', utils.stopEventAnd(function() {
        hideDropdown();
        self.trigger(eventName, value + value_suffix);
      }));

      list.appendChild(element);
    }

    for(var i = 0; i < items.length; i++) {
      var content = items[i].content, value = items[i].value;
      addItem(content, value);
    }

    utils.on(button, 'click', utils.stopEventAnd(function() {
      if (!justDismissed) {
        showDropdown();
      }
    }));

    return button;
  };

  return RichTextToolbar;
})();

var firepad = firepad || { };
firepad.WrappedOperation = (function (global) {
  'use strict';

  // A WrappedOperation contains an operation and corresponing metadata.
  function WrappedOperation (operation, meta) {
    this.wrapped = operation;
    this.meta    = meta;
  }

  WrappedOperation.prototype.apply = function () {
    return this.wrapped.apply.apply(this.wrapped, arguments);
  };

  WrappedOperation.prototype.invert = function () {
    var meta = this.meta;
    return new WrappedOperation(
      this.wrapped.invert.apply(this.wrapped, arguments),
      meta && typeof meta === 'object' && typeof meta.invert === 'function' ?
        meta.invert.apply(meta, arguments) : meta
    );
  };

  // Copy all properties from source to target.
  function copy (source, target) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }

  function composeMeta (a, b) {
    if (a && typeof a === 'object') {
      if (typeof a.compose === 'function') { return a.compose(b); }
      var meta = {};
      copy(a, meta);
      copy(b, meta);
      return meta;
    }
    return b;
  }

  WrappedOperation.prototype.compose = function (other) {
    return new WrappedOperation(
      this.wrapped.compose(other.wrapped),
      composeMeta(this.meta, other.meta)
    );
  };

  function transformMeta (meta, operation) {
    if (meta && typeof meta === 'object') {
      if (typeof meta.transform === 'function') {
        return meta.transform(operation);
      }
    }
    return meta;
  }

  WrappedOperation.transform = function (a, b) {
    var transform = a.wrapped.constructor.transform;
    var pair = transform(a.wrapped, b.wrapped);
    return [
      new WrappedOperation(pair[0], transformMeta(a.meta, b.wrapped)),
      new WrappedOperation(pair[1], transformMeta(b.meta, a.wrapped))
    ];
  };

  return WrappedOperation;

}());

var firepad = firepad || { };

firepad.UndoManager = (function () {
  'use strict';

  var NORMAL_STATE = 'normal';
  var UNDOING_STATE = 'undoing';
  var REDOING_STATE = 'redoing';

  // Create a new UndoManager with an optional maximum history size.
  function UndoManager (maxItems) {
    this.maxItems  = maxItems || 50;
    this.state = NORMAL_STATE;
    this.dontCompose = false;
    this.undoStack = [];
    this.redoStack = [];
  }

  // Add an operation to the undo or redo stack, depending on the current state
  // of the UndoManager. The operation added must be the inverse of the last
  // edit. When `compose` is true, compose the operation with the last operation
  // unless the last operation was alread pushed on the redo stack or was hidden
  // by a newer operation on the undo stack.
  UndoManager.prototype.add = function (operation, compose) {
    if (this.state === UNDOING_STATE) {
      this.redoStack.push(operation);
      this.dontCompose = true;
    } else if (this.state === REDOING_STATE) {
      this.undoStack.push(operation);
      this.dontCompose = true;
    } else {
      var undoStack = this.undoStack;
      if (!this.dontCompose && compose && undoStack.length > 0) {
        undoStack.push(operation.compose(undoStack.pop()));
      } else {
        undoStack.push(operation);
        if (undoStack.length > this.maxItems) { undoStack.shift(); }
      }
      this.dontCompose = false;
      this.redoStack = [];
    }
  };

  function transformStack (stack, operation) {
    var newStack = [];
    var Operation = operation.constructor;
    for (var i = stack.length - 1; i >= 0; i--) {
      var pair = Operation.transform(stack[i], operation);
      if (typeof pair[0].isNoop !== 'function' || !pair[0].isNoop()) {
        newStack.push(pair[0]);
      }
      operation = pair[1];
    }
    return newStack.reverse();
  }

  // Transform the undo and redo stacks against a operation by another client.
  UndoManager.prototype.transform = function (operation) {
    this.undoStack = transformStack(this.undoStack, operation);
    this.redoStack = transformStack(this.redoStack, operation);
  };

  // Perform an undo by calling a function with the latest operation on the undo
  // stack. The function is expected to call the `add` method with the inverse
  // of the operation, which pushes the inverse on the redo stack.
  UndoManager.prototype.performUndo = function (fn) {
    this.state = UNDOING_STATE;
    if (this.undoStack.length === 0) { throw new Error("undo not possible"); }
    fn(this.undoStack.pop());
    this.state = NORMAL_STATE;
  };

  // The inverse of `performUndo`.
  UndoManager.prototype.performRedo = function (fn) {
    this.state = REDOING_STATE;
    if (this.redoStack.length === 0) { throw new Error("redo not possible"); }
    fn(this.redoStack.pop());
    this.state = NORMAL_STATE;
  };

  // Is the undo stack not empty?
  UndoManager.prototype.canUndo = function () {
    return this.undoStack.length !== 0;
  };

  // Is the redo stack not empty?
  UndoManager.prototype.canRedo = function () {
    return this.redoStack.length !== 0;
  };

  // Whether the UndoManager is currently performing an undo.
  UndoManager.prototype.isUndoing = function () {
    return this.state === UNDOING_STATE;
  };

  // Whether the UndoManager is currently performing a redo.
  UndoManager.prototype.isRedoing = function () {
    return this.state === REDOING_STATE;
  };

  return UndoManager;

}());
var firepad = firepad || { };
firepad.Client = (function () {
  'use strict';

  // Client constructor
  function Client () {
    this.state = synchronized_; // start state
  }

  Client.prototype.setState = function (state) {
    this.state = state;
  };

  // Call this method when the user changes the document.
  Client.prototype.applyClient = function (operation) {
    this.setState(this.state.applyClient(this, operation));
  };

  // Call this method with a new operation from the server
  Client.prototype.applyServer = function (operation) {
    this.setState(this.state.applyServer(this, operation));
  };

  Client.prototype.serverAck = function () {
    this.setState(this.state.serverAck(this));
  };
  
  // Transforms a cursor position from the latest known server state to the
  // current client state. For example, if we get from the server the
  // information that another user's cursor is at position 3, but the server
  // hasn't yet received our newest operation, an insertion of 5 characters at
  // the beginning of the document, the correct position of the other user's
  // cursor in our current document is 8.
  Client.prototype.transformCursor = function (cursor) {
    return this.state.transformCursor(cursor);
  };
  
  Client.prototype.serverRetry = function() {
    this.setState(this.state.serverRetry(this));
  };

  // Override this method.
  Client.prototype.sendOperation = function (operation) {
    throw new Error("sendOperation must be defined in child class");
  };

  // Override this method.
  Client.prototype.applyOperation = function (operation) {
    throw new Error("applyOperation must be defined in child class");
  };


  // In the 'Synchronized' state, there is no pending operation that the client
  // has sent to the server.
  function Synchronized () {}
  Client.Synchronized = Synchronized;

  Synchronized.prototype.applyClient = function (client, operation) {
    // When the user makes an edit, send the operation to the server and
    // switch to the 'AwaitingConfirm' state
    client.sendOperation(operation);
    return new AwaitingConfirm(operation);
  };

  Synchronized.prototype.applyServer = function (client, operation) {
    // When we receive a new operation from the server, the operation can be
    // simply applied to the current document
    client.applyOperation(operation);
    return this;
  };

  Synchronized.prototype.serverAck = function (client) {
    throw new Error("There is no pending operation.");
  };

  Synchronized.prototype.serverRetry = function(client) {
    throw new Error("There is no pending operation.");
  };

  // Nothing to do because the latest server state and client state are the same.
  Synchronized.prototype.transformCursor = function (cursor) { return cursor; };

  // Singleton
  var synchronized_ = new Synchronized();


  // In the 'AwaitingConfirm' state, there's one operation the client has sent
  // to the server and is still waiting for an acknowledgement.
  function AwaitingConfirm (outstanding) {
    // Save the pending operation
    this.outstanding = outstanding;
  }
  Client.AwaitingConfirm = AwaitingConfirm;

  AwaitingConfirm.prototype.applyClient = function (client, operation) {
    // When the user makes an edit, don't send the operation immediately,
    // instead switch to 'AwaitingWithBuffer' state
    return new AwaitingWithBuffer(this.outstanding, operation);
  };

  AwaitingConfirm.prototype.applyServer = function (client, operation) {
    // This is another client's operation. Visualization:
    //
    //                   /\
    // this.outstanding /  \ operation
    //                 /    \
    //                 \    /
    //  pair[1]         \  / pair[0] (new outstanding)
    //  (can be applied  \/
    //  to the client's
    //  current document)
    var pair = operation.constructor.transform(this.outstanding, operation);
    client.applyOperation(pair[1]);
    return new AwaitingConfirm(pair[0]);
  };

  AwaitingConfirm.prototype.serverAck = function (client) {
    // The client's operation has been acknowledged
    // => switch to synchronized state
    return synchronized_;
  };

  AwaitingConfirm.prototype.serverRetry = function (client) {
    client.sendOperation(this.outstanding);
    return this;
  };

  AwaitingConfirm.prototype.transformCursor = function (cursor) {
    return cursor.transform(this.outstanding);
  };

  // In the 'AwaitingWithBuffer' state, the client is waiting for an operation
  // to be acknowledged by the server while buffering the edits the user makes
  function AwaitingWithBuffer (outstanding, buffer) {
    // Save the pending operation and the user's edits since then
    this.outstanding = outstanding;
    this.buffer = buffer;
  }
  Client.AwaitingWithBuffer = AwaitingWithBuffer;

  AwaitingWithBuffer.prototype.applyClient = function (client, operation) {
    // Compose the user's changes onto the buffer
    var newBuffer = this.buffer.compose(operation);
    return new AwaitingWithBuffer(this.outstanding, newBuffer);
  };

  AwaitingWithBuffer.prototype.applyServer = function (client, operation) {
    // Operation comes from another client
    //
    //                       /\
    //     this.outstanding /  \ operation
    //                     /    \
    //                    /\    /
    //       this.buffer /  \* / pair1[0] (new outstanding)
    //                  /    \/
    //                  \    /
    //          pair2[1] \  / pair2[0] (new buffer)
    // the transformed    \/
    // operation -- can
    // be applied to the
    // client's current
    // document
    //
    // * pair1[1]
    var transform = operation.constructor.transform;
    var pair1 = transform(this.outstanding, operation);
    var pair2 = transform(this.buffer, pair1[1]);
    client.applyOperation(pair2[1]);
    return new AwaitingWithBuffer(pair1[0], pair2[0]);
  };

  AwaitingWithBuffer.prototype.serverRetry = function (client) {
    // Merge with our buffer and resend.
    var outstanding = this.outstanding.compose(this.buffer);
    client.sendOperation(outstanding);
    return new AwaitingConfirm(outstanding);
  };

  AwaitingWithBuffer.prototype.serverAck = function (client) {
    // The pending operation has been acknowledged
    // => send buffer
    client.sendOperation(this.buffer);
    return new AwaitingConfirm(this.buffer);
  };

  AwaitingWithBuffer.prototype.transformCursor = function (cursor) {
    return cursor.transform(this.outstanding).transform(this.buffer);
  };

  return Client;

}());

var firepad = firepad || { };

firepad.EditorClient = (function () {
  'use strict';

  var Client = firepad.Client;
  var Cursor = firepad.Cursor;
  var UndoManager = firepad.UndoManager;
  var WrappedOperation = firepad.WrappedOperation;

  function SelfMeta (cursorBefore, cursorAfter) {
    this.cursorBefore = cursorBefore;
    this.cursorAfter  = cursorAfter;
  }

  SelfMeta.prototype.invert = function () {
    return new SelfMeta(this.cursorAfter, this.cursorBefore);
  };

  SelfMeta.prototype.compose = function (other) {
    return new SelfMeta(this.cursorBefore, other.cursorAfter);
  };

  SelfMeta.prototype.transform = function (operation) {
    return new SelfMeta(
      this.cursorBefore ? this.cursorBefore.transform(operation) : null,
      this.cursorAfter ? this.cursorAfter.transform(operation) : null
    );
  };

  function OtherClient (id, editorAdapter) {
    this.id = id;
    this.editorAdapter = editorAdapter;

    this.li = document.createElement('li');
  }

  OtherClient.prototype.setColor = function (color) {
    this.color = color;
  };

  OtherClient.prototype.updateCursor = function (cursor) {
    this.removeCursor();
    this.cursor = cursor;
    this.mark = this.editorAdapter.setOtherCursor(
      cursor,
      this.color,
      this.id
    );
  };

  OtherClient.prototype.removeCursor = function () {
    if (this.mark) { this.mark.clear(); }
  };

  function EditorClient (serverAdapter, editorAdapter) {
    Client.call(this);
    this.serverAdapter = serverAdapter;
    this.editorAdapter = editorAdapter;
    this.undoManager = new UndoManager();

    this.clients = { };

    var self = this;

    this.editorAdapter.registerCallbacks({
      change: function (operation, inverse) { self.onChange(operation, inverse); },
      cursorActivity: function () { self.onCursorActivity(); },
      blur: function () { self.onBlur(); }
    });
    this.editorAdapter.registerUndo(function () { self.undo(); });
    this.editorAdapter.registerRedo(function () { self.redo(); });

    this.serverAdapter.registerCallbacks({
      ack: function () { self.serverAck(); },
      retry: function() { self.serverRetry(); },
      operation: function (operation) {
        self.applyServer(operation);
      },
      cursor: function (clientId, cursor, color) {
        if (self.serverAdapter.userId_ === clientId) return;
        var client = self.getClientObject(clientId);
        if (cursor) {
          client.setColor(color);
          client.updateCursor(
            self.transformCursor(Cursor.fromJSON(cursor))
          );
        } else {
          client.removeCursor();
        }
      }
    });
  }

  inherit(EditorClient, Client);

  EditorClient.prototype.getClientObject = function (clientId) {
    var client = this.clients[clientId];
    if (client) { return client; }
    return this.clients[clientId] = new OtherClient(
      clientId,
      this.editorAdapter
    );
  };

  EditorClient.prototype.applyUnredo = function (operation) {
    this.undoManager.add(this.editorAdapter.invertOperation(operation));
    this.editorAdapter.applyOperation(operation.wrapped);
    this.cursor = operation.meta.cursorAfter;
    if (this.cursor)
      this.editorAdapter.setCursor(this.cursor);
    this.applyClient(operation.wrapped);
  };

  EditorClient.prototype.undo = function () {
    var self = this;
    if (!this.undoManager.canUndo()) { return; }
    this.undoManager.performUndo(function (o) { self.applyUnredo(o); });
  };

  EditorClient.prototype.redo = function () {
    var self = this;
    if (!this.undoManager.canRedo()) { return; }
    this.undoManager.performRedo(function (o) { self.applyUnredo(o); });
  };

  EditorClient.prototype.onChange = function (textOperation, inverse) {
    var cursorBefore = this.cursor;
    this.updateCursor();

    var compose = this.undoManager.undoStack.length > 0 &&
      inverse.shouldBeComposedWithInverted(last(this.undoManager.undoStack).wrapped);
    var inverseMeta = new SelfMeta(this.cursor, cursorBefore);
    this.undoManager.add(new WrappedOperation(inverse, inverseMeta), compose);
    this.applyClient(textOperation);
  };

  EditorClient.prototype.updateCursor = function () {
    this.cursor = this.editorAdapter.getCursor();
  };

  EditorClient.prototype.onCursorActivity = function () {
    var oldCursor = this.cursor;
    this.updateCursor();
    if (oldCursor && this.cursor.equals(oldCursor)) { return; }
    this.sendCursor(this.cursor);
  };

  EditorClient.prototype.onBlur = function () {
    this.cursor = null;
    this.sendCursor(null);
  };

  EditorClient.prototype.sendCursor = function (cursor) {
    if (this.state instanceof Client.AwaitingWithBuffer) { return; }
    this.serverAdapter.sendCursor(cursor);
  };

  EditorClient.prototype.sendOperation = function (operation) {
    this.serverAdapter.sendOperation(operation, this.cursor);
  };

  EditorClient.prototype.applyOperation = function (operation) {
    this.editorAdapter.applyOperation(operation);
    this.updateCursor();
    this.undoManager.transform(new WrappedOperation(operation, null));
  };

  // Set Const.prototype.__proto__ to Super.prototype
  function inherit (Const, Super) {
    function F () {}
    F.prototype = Super.prototype;
    Const.prototype = new F();
    Const.prototype.constructor = Const;
  }

  function last (arr) { return arr[arr.length - 1]; }

  return EditorClient;
}());

var ACEAdapter, firepad,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

if (typeof firepad === "undefined" || firepad === null) {
  firepad = {};
}

firepad.ACEAdapter = ACEAdapter = (function() {
  ACEAdapter.prototype.ignoreChanges = false;

  function ACEAdapter(ace) {
    this.ace = ace;
    this.onCursorActivity = __bind(this.onCursorActivity, this);
    this.onBlur = __bind(this.onBlur, this);
    this.onChange = __bind(this.onChange, this);
    this.aceSession = this.ace.getSession();
    this.aceDoc = this.aceSession.getDocument();
    this.aceDoc.setNewLineMode('unix');
    this.grabDocumentState();
    this.ace.on('change', this.onChange);
    this.ace.on('blur', this.onBlur);
    this.ace.on('focus', this.onCursorActivity);
    this.aceSession.selection.on('changeCursor', this.onCursorActivity);
  }

  ACEAdapter.prototype.grabDocumentState = function() {
    this.lastDocLines = this.aceDoc.getAllLines();
    return this.lastCursorRange = this.aceSession.selection.getRange();
  };

  ACEAdapter.prototype.detach = function() {
    this.ace.removeListener('change', this.onChange);
    this.ace.removeListener('blur', this.onBlur);
    this.ace.removeListener('focus', this.onCursorActivity);
    return this.aceSession.selection.removeListener('changeCursor', this.onCursorActivity);
  };

  ACEAdapter.prototype.onChange = function(change) {
    var pair;
    if (!this.ignoreChanges) {
      pair = this.operationFromACEChange(change);
      this.trigger.apply(this, ['change'].concat(__slice.call(pair)));
      return this.grabDocumentState();
    }
  };

  ACEAdapter.prototype.onBlur = function() {
    if (this.ace.selection.isEmpty()) {
      return this.trigger('blur');
    }
  };

  ACEAdapter.prototype.onCursorActivity = function() {
    var _this = this;
    return setTimeout((function() {
      return _this.trigger('cursorActivity');
    }), 0);
  };

  ACEAdapter.prototype.operationFromACEChange = function(change) {
    var action, delta, inverse, operation, restLength, start, text, _ref, _ref1;
    delta = change.data;
    if ((_ref = delta.action) === "insertLines" || _ref === "removeLines") {
      text = delta.lines.join("\n") + "\n";
      action = delta.action.replace("Lines", "");
    } else {
      text = delta.text.replace(this.aceDoc.getNewLineCharacter(), '\n');
      action = delta.action.replace("Text", "");
    }
    start = this.indexFromPos(delta.range.start);
    restLength = this.lastDocLines.join('\n').length - start;
    if (action === "remove") {
      restLength -= text.length;
    }
    operation = new firepad.TextOperation().retain(start).insert(text).retain(restLength);
    inverse = new firepad.TextOperation().retain(start)["delete"](text).retain(restLength);
    if (action === 'remove') {
      _ref1 = [inverse, operation], operation = _ref1[0], inverse = _ref1[1];
    }
    return [operation, inverse];
  };

  ACEAdapter.prototype.applyOperationToACE = function(operation) {
    var from, index, op, range, to, _i, _len, _ref, _ref1;
    if (this.aceRange == null) {
      this.aceRange = ((_ref = ace.require) != null ? _ref : require)("ace/range").Range;
    }
    index = 0;
    _ref1 = operation.ops;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      op = _ref1[_i];
      if (op.isRetain()) {
        index += op.chars;
      } else if (op.isInsert()) {
        this.aceDoc.insert(this.posFromIndex(index), op.text);
        index += op.text.length;
      } else if (op.isDelete()) {
        from = this.posFromIndex(index);
        to = this.posFromIndex(index + op.chars);
        range = this.aceRange.fromPoints(from, to);
        this.aceDoc.remove(range);
      }
    }
    return this.grabDocumentState();
  };

  ACEAdapter.prototype.posFromIndex = function(index) {
    var line, row, _i, _len, _ref;
    _ref = this.aceDoc.$lines;
    for (row = _i = 0, _len = _ref.length; _i < _len; row = ++_i) {
      line = _ref[row];
      if (index <= line.length) {
        break;
      }
      index -= line.length + 1;
    }
    return {
      row: row,
      column: index
    };
  };

  ACEAdapter.prototype.indexFromPos = function(pos, lines) {
    var i, index, _i, _ref;
    if (lines == null) {
      lines = this.lastDocLines;
    }
    index = 0;
    for (i = _i = 0, _ref = pos.row; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      index += this.lastDocLines[i].length + 1;
    }
    return index += pos.column;
  };

  ACEAdapter.prototype.getValue = function() {
    return this.aceDoc.getValue();
  };

  ACEAdapter.prototype.getCursor = function() {
    var e, e2, end, start, _ref, _ref1;
    try {
      start = this.indexFromPos(this.aceSession.selection.getRange().start, this.aceDoc.$lines);
      end = this.indexFromPos(this.aceSession.selection.getRange().end, this.aceDoc.$lines);
    } catch (_error) {
      e = _error;
      try {
        start = this.indexFromPos(this.lastCursorRange.start);
        end = this.indexFromPos(this.lastCursorRange.end);
      } catch (_error) {
        e2 = _error;
        console.log("Couldn't figure out the cursor range:", e2, "-- setting it to 0:0.");
        _ref = [0, 0], start = _ref[0], end = _ref[1];
      }
    }
    if (start > end) {
      _ref1 = [end, start], start = _ref1[0], end = _ref1[1];
    }
    return new firepad.Cursor(start, end);
  };

  ACEAdapter.prototype.setCursor = function(cursor) {
    var end, start, _ref, _ref1;
    if (this.aceRange == null) {
      this.aceRange = ((_ref = ace.require) != null ? _ref : require)("ace/range").Range;
    }
    start = this.posFromIndex(cursor.position);
    end = this.posFromIndex(cursor.selectionEnd);
    if (cursor.position > cursor.selectionEnd) {
      _ref1 = [end, start], start = _ref1[0], end = _ref1[1];
    }
    return this.aceSession.selection.setSelectionRange(new this.aceRange(start.row, start.column, end.row, end.column));
  };

  ACEAdapter.prototype.setOtherCursor = function(cursor, color, clientId) {
    var clazz, css, cursorRange, end, justCursor, start, _ref,
      _this = this;
    if (this.otherCursors == null) {
      this.otherCursors = {};
    }
    cursorRange = this.otherCursors[clientId];
    if (cursorRange) {
      cursorRange.start.detach();
      cursorRange.end.detach();
      this.aceSession.removeMarker(cursorRange.id);
    }
    start = this.posFromIndex(cursor.position);
    end = this.posFromIndex(cursor.selectionEnd);
    if (cursor.selectionEnd < cursor.position) {
      _ref = [end, start], start = _ref[0], end = _ref[1];
    }
    clazz = "other-client-selection-" + (color.replace('#', ''));
    justCursor = cursor.position === cursor.selectionEnd;
    if (justCursor) {
      end.column += 1;
      clazz = clazz.replace('selection', 'cursor');
    }
    css = "." + clazz + " {\n  position: absolute;\n  background-color: " + (justCursor ? 'transparent' : color) + ";\n  border-left: 2px solid " + color + ";\n}";
    this.addStyleRule(css);
    this.otherCursors[clientId] = cursorRange = new this.aceRange(start.row, start.column, end.row, end.column);
    cursorRange.start = this.aceDoc.createAnchor(cursorRange.start);
    cursorRange.end = this.aceDoc.createAnchor(cursorRange.end);
    cursorRange.id = this.aceSession.addMarker(cursorRange, clazz, "text");
    return {
      clear: function() {
        cursorRange.start.detach();
        cursorRange.end.detach();
        return _this.aceSession.removeMarker(cursorRange.id);
      }
    };
  };

  ACEAdapter.prototype.addStyleRule = function(css) {
    var styleElement;
    if (typeof document === "undefined" || document === null) {
      return;
    }
    if (!this.addedStyleRules) {
      this.addedStyleRules = {};
      styleElement = document.createElement('style');
      document.documentElement.getElementsByTagName('head')[0].appendChild(styleElement);
      this.addedStyleSheet = styleElement.sheet;
    }
    if (this.addedStyleRules[css]) {
      return;
    }
    this.addedStyleRules[css] = true;
    return this.addedStyleSheet.insertRule(css, 0);
  };

  ACEAdapter.prototype.registerCallbacks = function(callbacks) {
    this.callbacks = callbacks;
  };

  ACEAdapter.prototype.trigger = function() {
    var args, event, _ref, _ref1;
    event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (_ref = this.callbacks) != null ? (_ref1 = _ref[event]) != null ? _ref1.apply(this, args) : void 0 : void 0;
  };

  ACEAdapter.prototype.applyOperation = function(operation) {
    if (!operation.isNoop()) {
      this.ignoreChanges = true;
    }
    this.applyOperationToACE(operation);
    return this.ignoreChanges = false;
  };

  ACEAdapter.prototype.registerUndo = function(undoFn) {
    return this.ace.undo = undoFn;
  };

  ACEAdapter.prototype.registerRedo = function(redoFn) {
    return this.ace.redo = redoFn;
  };

  ACEAdapter.prototype.invertOperation = function(operation) {
    return operation.invert(this.getValue());
  };

  return ACEAdapter;

})();

var firepad = firepad || { };

firepad.AttributeConstants = {
  BOLD: 'b',
  ITALIC: 'i',
  UNDERLINE: 'u',
  STRIKE: 's',
  FONT: 'f',
  FONT_SIZE: 'fs',
  COLOR: 'c',
  BACKGROUND_COLOR: 'bc',
  ENTITY_SENTINEL: 'ent',

// Line Attributes
  LINE_SENTINEL: 'l',
  LINE_INDENT: 'li',
  LINE_ALIGN: 'la',
  LIST_TYPE: 'lt'
};

var firepad = firepad || { };

firepad.EntityManager = (function () {
  function EntityManager() {
    this.entities_ = {};
  }

  EntityManager.prototype.register = function(type, options) {
    firepad.utils.assert(options.render, "Entity options should include a 'render' function!");
    firepad.utils.assert(options.fromElement, "Entity options should include a 'fromElement' function!");
    this.entities_[type] = options;
  };

  EntityManager.prototype.renderToElement = function(entity, entityHandle) {
    return this.tryRenderToElement_(entity, 'render', entityHandle);
  };

  EntityManager.prototype.exportToElement = function(entity) {
    // Turns out 'export' is a reserved keyword, so 'getHtml' is preferable.
    var elt = this.tryRenderToElement_(entity, 'export') ||
              this.tryRenderToElement_(entity, 'getHtml') ||
              this.tryRenderToElement_(entity, 'render');
    elt.setAttribute('data-firepad-entity', entity.type);
    return elt;
  };

  EntityManager.prototype.fromElement = function(element) {
    var type = element.getAttribute('data-firepad-entity');

    // HACK.  This should be configurable through entity registration.
    if (!type)
      type = element.nodeName.toLowerCase();

    if (type && this.entities_[type]) {
      var info = this.entities_[type].fromElement(element);
      return new firepad.Entity(type, info);
    }
  };

  EntityManager.prototype.tryRenderToElement_ = function(entity, renderFn, entityHandle) {
    var type = entity.type, info = entity.info;
    if (this.entities_[type] && this.entities_[type][renderFn]) {
      var res = this.entities_[type][renderFn](info, entityHandle);
      if (res) {
        if (typeof res === 'string') {
          var div = document.createElement('div');
          div.innerHTML = res;
          return div.childNodes[0];
        } else if (typeof res === 'object') {
          firepad.utils.assert(typeof res.nodeType !== 'undefined', 'Error rendering ' + type + ' entity.  render() function' +
              ' must return an html string or a DOM element.');
          return res;
        }
      }
    }
  };

  return EntityManager;
})();

var firepad = firepad || { };

/**
 * Object to represent an Entity.
 */
firepad.Entity = (function() {
  var ATTR = firepad.AttributeConstants;
  var SENTINEL = ATTR.ENTITY_SENTINEL;
  var PREFIX = SENTINEL + '_';

  function Entity(type, info) {
    // Allow calling without new.
    if (!(this instanceof Entity)) { return new Entity(type, info); }

    this.type = type;
    this.info = info || { };
  }

  Entity.prototype.toAttributes = function() {
    var attrs = { };
    attrs[SENTINEL] = this.type;

    for(var attr in this.info) {
      attrs[PREFIX + attr] = this.info[attr];
    }

    return attrs;
  };

  Entity.fromAttributes = function(attributes) {
    var type = attributes[SENTINEL];
    var info = { };
    for(var attr in attributes) {
      if (attr.indexOf(PREFIX) === 0) {
        info[attr.substr(PREFIX.length)] = attributes[attr];
      }
    }

    return new Entity(type, info);
  };

  return Entity;
})();
var firepad = firepad || { };

firepad.RichTextCodeMirror = (function () {
  var AnnotationList = firepad.AnnotationList;
  var Span = firepad.Span;
  var utils = firepad.utils;
  var ATTR = firepad.AttributeConstants;
  var RichTextClassPrefixDefault = 'cmrt-';
  var RichTextOriginPrefix = 'cmrt-';

  // These attributes will have styles generated dynamically in the page.
  var DynamicStyleAttributes = {
    'c' : 'color', 
    'bc': 'background-color',
    'fs' : 'font-size',
    'li' : function(indent) { return 'margin-left: ' + (indent * 40) + 'px'; }
  };

  // A cache of dynamically-created styles so we can re-use them.
  var StyleCache_ = {};

  function RichTextCodeMirror(codeMirror, entityManager, options) {
    this.codeMirror = codeMirror;
    this.options_ = options || { };
    this.entityManager_ = entityManager;
    this.currentAttributes_ = null;

    var self = this;
    this.annotationList_ = new AnnotationList(
        function(oldNodes, newNodes) { self.onAnnotationsChanged_(oldNodes, newNodes); });

    // Ensure annotationList is in sync with any existing codemirror contents.
    this.initAnnotationList_();

    bind(this, 'onCodeMirrorBeforeChange_');
    bind(this, 'onCodeMirrorChange_');
    bind(this, 'onCursorActivity_');

    this.codeMirror.on('beforeChange', this.onCodeMirrorBeforeChange_);
    this.codeMirror.on('change', this.onCodeMirrorChange_);
    this.codeMirror.on('cursorActivity', this.onCursorActivity_);

    this.changeId_ = 0;
    this.outstandingChanges_ = { };
    this.dirtyLines_ = [];
  }
  utils.makeEventEmitter(RichTextCodeMirror, ['change', 'attributesChange', 'newLine']);

  // A special character we insert at the beginning of lines so we can attach attributes to it to represent
  // "line attributes."  E000 is from the unicode "private use" range.
  var LineSentinelCharacter = '\uE000';
  RichTextCodeMirror.LineSentinelCharacter = LineSentinelCharacter;

  // A special character used to represent any "entity" inserted into the document (e.g. an image).
  var EntitySentinelCharacter = '\uE001';
  RichTextCodeMirror.EntitySentinelCharacter = EntitySentinelCharacter;

  RichTextCodeMirror.prototype.detach = function() {
    this.codeMirror.off('beforeChange', this.onCodeMirrorBeforeChange_);
    this.codeMirror.off('change', this.onCodeMirrorChange_);
    this.codeMirror.off('cursorActivity', this.onCursorActivity_);
    this.clearAnnotations_();
  };

  RichTextCodeMirror.prototype.toggleAttribute = function(attribute, value) {
    var trueValue = value || true;
    if (this.emptySelection_()) {
      var attrs = this.getCurrentAttributes_();
      if (attrs[attribute] === trueValue) {
        delete attrs[attribute];
      } else {
        attrs[attribute] = trueValue;
      }
      this.currentAttributes_ = attrs;
    } else {
      var attributes = this.getCurrentAttributes_();
      var newValue = (attributes[attribute] !== trueValue) ? trueValue : false;
      this.setAttribute(attribute, newValue);
    }
  };

  RichTextCodeMirror.prototype.setAttribute = function(attribute, value) {
    var cm = this.codeMirror;
    if (this.emptySelection_()) {
      var attrs = this.getCurrentAttributes_();
      if (value === false) {
        delete attrs[attribute];
      } else {
        attrs[attribute] = value;
      }
      this.currentAttributes_ = attrs;
    } else {
      this.updateTextAttributes(cm.indexFromPos(cm.getCursor('start')), cm.indexFromPos(cm.getCursor('end')),
        function(attributes) {
          if (value === false) {
            delete attributes[attribute];
          } else {
            attributes[attribute] = value;
          }
        });

      this.updateCurrentAttributes_();
    }
  };

  RichTextCodeMirror.prototype.updateTextAttributes = function(start, end, updateFn, origin, doLineAttributes) {
    var newChangeList = { }, newChange = newChangeList;
    var pos = start, self = this;
    this.annotationList_.updateSpan(new Span(start, end - start), function(annotation, length) {
      var attributes = { };
      for(var attr in annotation.attributes) {
        attributes[attr] = annotation.attributes[attr];
      }

      // Don't modify if this is a line sentinel.
      if (!attributes[ATTR.LINE_SENTINEL] || doLineAttributes)
        updateFn(attributes);

      // changedAttributes will be the attributes we changed, with their new values.
      // changedAttributesInverse will be the attributes we changed, with their old values.
      var changedAttributes = { }, changedAttributesInverse = { };
      self.computeChangedAttributes_(annotation.attributes, attributes, changedAttributes, changedAttributesInverse);
      if (!emptyAttributes(changedAttributes)) {
        newChange.next = { start: pos, end: pos + length, attributes: changedAttributes, attributesInverse: changedAttributesInverse, origin: origin };
        newChange = newChange.next;
      }

      pos += length;
      return new RichTextAnnotation(attributes);
    });

    if (newChangeList.next) {
      this.trigger('attributesChange', this, newChangeList.next);
    }
  };

  RichTextCodeMirror.prototype.computeChangedAttributes_ = function(oldAttrs, newAttrs, changed, inverseChanged) {
    var attrs = { }, attr;
    for(attr in oldAttrs) { attrs[attr] = true; }
    for(attr in newAttrs) { attrs[attr] = true; }

    for (attr in attrs) {
      if (!(attr in newAttrs)) {
        // it was removed.
        changed[attr] = false;
        inverseChanged[attr] = oldAttrs[attr];
      } else if (!(attr in oldAttrs)) {
        // it was added.
        changed[attr] = newAttrs[attr];
        inverseChanged[attr] = false;
      } else if (oldAttrs[attr] !== newAttrs[attr]) {
        // it was changed.
        changed[attr] = newAttrs[attr];
        inverseChanged[attr] = oldAttrs[attr];
      }
    }
  };

  RichTextCodeMirror.prototype.toggleLineAttribute = function(attribute, value) {
    var currentAttributes = this.getCurrentLineAttributes_();
    var newValue;
    if (!(attribute in currentAttributes) || currentAttributes[attribute] !== value) {
      newValue = value;
    } else {
      newValue = false;
    }
    this.setLineAttribute(attribute, newValue);
  };

  RichTextCodeMirror.prototype.setLineAttribute = function(attribute, value) {
    this.updateLineAttributesForSelection(function(attributes) {
      if (value === false) {
        delete attributes[attribute];
      } else {
        attributes[attribute] = value;
      }
    });
  };

  RichTextCodeMirror.prototype.updateLineAttributesForSelection = function(updateFn) {
    var cm = this.codeMirror;
    var start = cm.getCursor('start'), end = cm.getCursor('end');
    var startLine = start.line, endLine = end.line;
    var endLineText = cm.getLine(endLine);
    var endsAtBeginningOfLine = this.areLineSentinelCharacters_(endLineText.substr(0, end.ch));
    if (endLine > startLine && endsAtBeginningOfLine) {
      // If the selection ends at the beginning of a line, don't include that line.
      endLine--;
    }

    this.updateLineAttributes(startLine, endLine, updateFn);
  };

  RichTextCodeMirror.prototype.updateLineAttributes = function(startLine, endLine, updateFn) {
    // TODO: Batch this into a single operation somehow.
    for(var line = startLine; line <= endLine; line++) {
      var text = this.codeMirror.getLine(line);
      var lineStartIndex = this.codeMirror.indexFromPos({line: line, ch: 0});
      // Create line sentinel character if necessary.
      if (text[0] !== LineSentinelCharacter) {
        var attributes = { };
        attributes[ATTR.LINE_SENTINEL] = true;
        updateFn(attributes);
        this.insertText(lineStartIndex, LineSentinelCharacter, attributes);
      } else {
        this.updateTextAttributes(lineStartIndex, lineStartIndex + 1, updateFn, /*origin=*/null, /*doLineAttributes=*/true);
      }
    }
  };

  RichTextCodeMirror.prototype.replaceText = function(start, end, text, attributes, origin) {
    this.changeId_++;
    var newOrigin = RichTextOriginPrefix + this.changeId_;
    this.outstandingChanges_[newOrigin] = { origOrigin: origin, attributes: attributes };

    var cm = this.codeMirror;
    var from = cm.posFromIndex(start);
    var to = typeof end === 'number' ? cm.posFromIndex(end) : null;
    cm.replaceRange(text, from, to, newOrigin);
  };

  RichTextCodeMirror.prototype.insertText = function(index, text, attributes, origin) {
    this.replaceText(index, null, text, attributes, origin);
  };

  RichTextCodeMirror.prototype.removeText = function(start, end, origin) {
    var cm = this.codeMirror;
    cm.replaceRange("", cm.posFromIndex(start), cm.posFromIndex(end), origin);
  };

  RichTextCodeMirror.prototype.insertEntityAtCursor = function(type, info, origin) {
    var cm = this.codeMirror;
    var index = cm.indexFromPos(cm.getCursor('head'));
    this.insertEntityAt(index, type, info, origin);
  };

  RichTextCodeMirror.prototype.insertEntityAt = function(index, type, info, origin) {
    var cm = this.codeMirror;
    this.insertEntity_(index, new firepad.Entity(type, info), origin);
  };

  RichTextCodeMirror.prototype.insertEntity_ = function(index, entity, origin) {
    this.replaceText(index, null, EntitySentinelCharacter, entity.toAttributes(), origin);
  };

  RichTextCodeMirror.prototype.getAttributeSpans = function(start, end) {
    var spans = [];
    var annotatedSpans = this.annotationList_.getAnnotatedSpansForSpan(new Span(start, end - start));
    for(var i  = 0; i < annotatedSpans.length; i++) {
      spans.push({ length: annotatedSpans[i].length, attributes: annotatedSpans[i].annotation.attributes });
    }

    return spans;
  };

  RichTextCodeMirror.prototype.end = function() {
    var lastLine = this.codeMirror.lineCount() - 1;
    return this.codeMirror.indexFromPos({line: lastLine, ch: this.codeMirror.getLine(lastLine).length});
  };

  RichTextCodeMirror.prototype.getRange = function(start, end) {
    var from = this.codeMirror.posFromIndex(start), to = this.codeMirror.posFromIndex(end);
    return this.codeMirror.getRange(from, to);
  };

  RichTextCodeMirror.prototype.initAnnotationList_ = function() {
    // Insert empty annotation span for existing content.
    var end = this.end();
    if (end !== 0) {
      this.annotationList_.insertAnnotatedSpan(new Span(0, end), new RichTextAnnotation());
    }
  };

  RichTextCodeMirror.prototype.onAnnotationsChanged_ = function(oldNodes, newNodes) {
    var marker;

    var linesToReMark = { };

    for(var i = 0; i < oldNodes.length; i++) {
      var attributes = oldNodes[i].annotation.attributes;
      if (ATTR.LINE_SENTINEL in attributes) {
        linesToReMark[this.codeMirror.posFromIndex(oldNodes[i].pos).line] = true;
      }
      marker = oldNodes[i].getAttachedObject();
      if (marker) {
        marker.clear();
      }
    }

    for (i = 0; i < newNodes.length; i++) {
      var annotation = newNodes[i].annotation;
      var forLine = (ATTR.LINE_SENTINEL in annotation.attributes);
      var entity = (ATTR.ENTITY_SENTINEL in annotation.attributes);

      var from = this.codeMirror.posFromIndex(newNodes[i].pos);
      if (forLine) {
        linesToReMark[from.line] = true;
      } else if (entity) {
        this.markEntity_(newNodes[i]);
      } else {
        var className = this.getClassNameForAttributes_(annotation.attributes);
        if (className !== '') {
          var to = this.codeMirror.posFromIndex(newNodes[i].pos + newNodes[i].length);
          marker = this.codeMirror.markText(from, to, { className: className });
          newNodes[i].attachObject(marker);
        }
      }
    }

    for(var line in linesToReMark) {
      this.dirtyLines_.push(this.codeMirror.getLineHandle(Number(line)));
      this.queueLineMarking_();
    }
  };

  RichTextCodeMirror.prototype.queueLineMarking_ = function() {
    if (this.lineMarkTimeout_ != null) return;
    var self = this;

    this.lineMarkTimeout_ = setTimeout(function() {
      self.lineMarkTimeout_ = null;
      var dirtyLineNumbers = [];
      for(var i = 0; i < self.dirtyLines_.length; i++) {
        var lineNum = self.codeMirror.getLineNumber(self.dirtyLines_[i]);
        dirtyLineNumbers.push(Number(lineNum));
      }
      self.dirtyLines_ = [];

      dirtyLineNumbers.sort(function(a, b) { return a - b; });
      var lastLineMarked = -1;
      for(i = 0; i < dirtyLineNumbers.length; i++) {
        var lineNumber = dirtyLineNumbers[i];
        if (lineNumber > lastLineMarked) {
          lastLineMarked = self.markLineSentinelCharactersForChangedLines_(lineNumber, lineNumber);
        }
      }
    }, 0);
  };

  RichTextCodeMirror.prototype.addStyleWithCSS_ = function(css) {
    var head = document.getElementsByTagName('head')[0],
        style = document.createElement('style');
    
    style.type = 'text/css';
    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    
    head.appendChild(style);
  };

  RichTextCodeMirror.prototype.getClassNameForAttributes_ = function(attributes) {
    var globalClassName = '';
    for (var attr in attributes) {
      var val = attributes[attr];
      if (attr === ATTR.LINE_SENTINEL) {
        firepad.utils.assert(val === true, "LINE_SENTINEL attribute should be true if it exists.");
      } else {
        var className = (this.options_['cssPrefix'] || RichTextClassPrefixDefault) + attr;
        if (val !== true) {
          // Append "px" to font size if it's missing.
          // Probably could be removed now as parseHtml automatically adds px when required
          if (attr === ATTR.FONT_SIZE && typeof val !== "string") {
            val = val + "px";
          }

          var classVal = val.toString().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
          className += '-' + classVal;
          if (DynamicStyleAttributes[attr]) {
            if (!StyleCache_[attr]) StyleCache_[attr] = {};
            if (!StyleCache_[attr][classVal]) {
              StyleCache_[attr][classVal] = true;
              var dynStyle = DynamicStyleAttributes[attr];
              var css = (typeof dynStyle === 'function') ?
                  dynStyle(val) :
                  dynStyle + ": " + val;

              var selector = (attr == ATTR.LINE_INDENT) ?
                  'pre.' + className :
                  '.' + className;

              this.addStyleWithCSS_(selector + ' { ' + css + ' }');
            }
          }
        }
        globalClassName = globalClassName + ' ' + className;
      }
    }
    return globalClassName;
  };

  RichTextCodeMirror.prototype.markEntity_ = function(annotationNode) {
    var attributes = annotationNode.annotation.attributes;
    var entity = firepad.Entity.fromAttributes(attributes);
    var cm = this.codeMirror;
    var self = this;

    var markers = [];
    for(var i = 0; i < annotationNode.length; i++) {
      var from = cm.posFromIndex(annotationNode.pos + i);
      var to = cm.posFromIndex(annotationNode.pos + i + 1);

      var options = { collapsed: true, atomic: true, inclusiveLeft: false, inclusiveRight: false };

      var entityHandle = this.createEntityHandle_(entity, annotationNode.pos);

      var element = this.entityManager_.renderToElement(entity, entityHandle);
      if (element) {
        options.replacedWith = element;
      }
      var marker = cm.markText(from, to, options);
      markers.push(marker);
      entityHandle.setMarker(marker);
    }

    annotationNode.attachObject({
      clear: function() {
        for(var i = 0; i < markers.length; i++) {
          markers[i].clear();
        }
      }
    });

    // This probably shouldn't be necessary.  There must be a lurking CodeMirror bug.
    this.queueRefresh_();
  };

  RichTextCodeMirror.prototype.queueRefresh_ = function() {
    var self = this;
    if (!this.refreshTimer_) {
      this.refreshTimer_ = setTimeout(function() {
        self.codeMirror.refresh();
        self.refreshTimer_ = null;
      }, 0);
    }
  };

  RichTextCodeMirror.prototype.createEntityHandle_ = function(entity, location) {
    var marker = null;
    var self = this;

    function find() {
      if (marker) {
        var where = marker.find();
        return where ? self.codeMirror.indexFromPos(where.from) : null;
      } else {
        return location;
      }
    }

    function remove() {
      var at = find();
      if (at != null) {
        self.codeMirror.focus();
        self.removeText(at, at + 1);
      }
    }

    function replace(info) {
      var at = find();
      remove();
      self.insertEntity_(at, new firepad.Entity(entity.type, info));
    }

    function setMarker(m) {
      marker = m;
    }

    return { find: find, remove: remove, replace: replace, setMarker: setMarker };
  };

  RichTextCodeMirror.prototype.lineClassRemover_ = function(lineNum) {
    var cm = this.codeMirror;
    var lineHandle = cm.getLineHandle(lineNum);
    return {
      clear: function() {
        // HACK to remove all classes (since CodeMirror treats this as a regex internally).
        cm.removeLineClass(lineHandle, "text", ".*");
      }
    }
  };

  RichTextCodeMirror.prototype.emptySelection_ = function() {
    var start = this.codeMirror.getCursor('start'), end = this.codeMirror.getCursor('end');
    return (start.line === end.line && start.ch === end.ch);
  };

  RichTextCodeMirror.prototype.onCodeMirrorBeforeChange_ = function(cm, change) {
    // Remove LineSentinelCharacters from incoming input (e.g copy/pasting)
    if (change.origin === '+input' || change.origin === 'paste') {
      var newText = [];
      for(var i = 0; i < change.text.length; i++) {
        var t = change.text[i];
        t = t.replace(new RegExp('[' + LineSentinelCharacter + EntitySentinelCharacter + ']', 'g'), '');
        newText.push(t);
      }
      change.update(change.from, change.to, newText);
    }
  };

  function cmpPos (a, b) {
    return (a.line - b.line) || (a.ch - b.ch);
  }
  function posEq (a, b) { return cmpPos(a, b) === 0; }
  function posLe (a, b) { return cmpPos(a, b) <= 0; }

  function last (arr) { return arr[arr.length - 1]; }

  function sumLengths (strArr) {
    if (strArr.length === 0) { return 0; }
    var sum = 0;
    for (var i = 0; i < strArr.length; i++) { sum += strArr[i].length; }
    return sum + strArr.length - 1;
  }

  RichTextCodeMirror.prototype.onCodeMirrorChange_ = function(cm, cmChanges) {
    var changes = this.convertCoordinateSystemForChanges_(cmChanges);

    var newChangeList = { }, newChange = newChangeList;
    var change = changes;
    while (change) {
      var start = change.start, end = change.end, text = change.text, removed = change.removed, origin = change.origin;

      // When text with multiple sets of attributes on it is removed, we need to split it into separate remove changes.
      if (removed.length > 0) {
        var oldAnnotationSpans = this.annotationList_.getAnnotatedSpansForSpan(new Span(start, removed.length));
        var removedPos = 0;
        for(i = 0; i < oldAnnotationSpans.length; i++) {
          var span = oldAnnotationSpans[i];
          newChange.next = { start: start, end: start + span.length, removedAttributes: span.annotation.attributes,
            removed: removed.substr(removedPos, span.length), attributes: { }, text: "", origin: change.origin };
          newChange = newChange.next;
          removedPos += span.length;
        }
        
        this.annotationList_.removeSpan(new Span(start, removed.length));
      }

      if (text.length > 0) {
        var attributes;
        // TODO: Handle 'paste' differently?
        if (change.origin === '+input' || change.origin === 'paste') {
          attributes = this.currentAttributes_ || { };
        } else if (origin in this.outstandingChanges_) {
          attributes = this.outstandingChanges_[origin].attributes;
          origin = this.outstandingChanges_[origin].origOrigin;
          delete this.outstandingChanges_[origin];
        } else {
          attributes = {};
        }

        this.annotationList_.insertAnnotatedSpan(new Span(start, text.length), new RichTextAnnotation(attributes));

        newChange.next = { start: start, end: start, removedAttributes: { }, removed: "", text: text,
          attributes: attributes, origin: origin };
        newChange = newChange.next;
      }

      change = change.next;
    }

    this.markLineSentinelCharactersForChanges_(cmChanges);

    if (newChangeList.next) {
      this.trigger('change', this, newChangeList.next);
    }
  };

  RichTextCodeMirror.prototype.convertCoordinateSystemForChanges_ = function(cmChanges) {
    // We have to convert the positions in the pre-change coordinate system to indexes.
    // CodeMirror's `indexFromPos` method does this for the current state of the editor.
    // We can use the information of a single change object to convert a post-change
    // coordinate system to a pre-change coordinate system. We can now proceed inductively
    // to get a pre-change coordinate system for all changes in the linked list.  A
    // disadvantage of this approach is its complexity `O(n^2)` in the length of the
    // linked list of changes.

    var changes = [], i = 0;
    var cmChange = cmChanges;
    while (cmChange) {
      changes[i++] = cmChange;
      cmChange = cmChange.next;
    }

    var self = this;
    var indexFromPos = function (pos) {
      return self.codeMirror.indexFromPos(pos);
    };

    function updateIndexFromPos (indexFromPos, change) {
      return function (pos) {
        if (posLe(pos, change.from)) { return indexFromPos(pos); }
        if (posLe(change.to, pos)) {
          return indexFromPos({
            line: pos.line + change.text.length - 1 - (change.to.line - change.from.line),
            ch: (change.to.line < pos.line) ?
                pos.ch :
                (change.text.length <= 1) ?
                    pos.ch - (change.to.ch - change.from.ch) + sumLengths(change.text) :
                    pos.ch - change.to.ch + last(change.text).length
          }) + sumLengths(change.removed) - sumLengths(change.text);
        }
        if (change.from.line === pos.line) {
          return indexFromPos(change.from) + pos.ch - change.from.ch;
        }
        return indexFromPos(change.from) +
            sumLengths(change.removed.slice(0, pos.line - change.from.line)) +
            1 + pos.ch;
      };
    }

    var newChange = null;
    for (var c = changes.length - 1; c >= 0; c--) {
      change = changes[c];
      indexFromPos = updateIndexFromPos(indexFromPos, change);

      var start = indexFromPos(change.from);

      var removedText = change.removed.join('\n');
      var text = change.text.join('\n');
      newChange = { start: start, end: start + removedText.length, removed: removedText, text: text,
        origin: change.origin, next: newChange };

      change = change.next;
    }

    return newChange;
  };

  /**
   * Detects whether any line sentinel characters were added or removed by the change and if so,
   * re-marks line sentinel characters on the affected range of lines.
   * @param changes
   * @private
   */
  RichTextCodeMirror.prototype.markLineSentinelCharactersForChanges_ = function(changes) {
    // TODO: This doesn't handle multiple changes correctly (overlapping, out-of-oder, etc.).
    // But In practice, people using firepad for rich-text editing don't batch multiple changes
    // together, so this isn't quite as bad as it seems.
    var startLine = Number.MAX_VALUE, endLine = -1;

    var change = changes;
    while (change) {
      var line = change.from.line, ch = change.from.ch;

      if (change.removed.length > 1 || change.removed[0].indexOf(LineSentinelCharacter) >= 0) {
        // We removed 1+ newlines or line sentinel characters.
        startLine = Math.min(startLine, line);
        endLine = Math.max(endLine, line);
      }

      if (change.text.length > 1) { // 1+ newlines
        startLine = Math.min(startLine, line);
        endLine = Math.max(endLine, line + change.text.length - 1);
      } else if (change.text[0].indexOf(LineSentinelCharacter) >= 0) {
        startLine = Math.min(startLine, line);
        endLine = Math.max(endLine, line);
      }

      change = change.next;
    }

    // HACK: Because the above code doesn't handle multiple changes correctly, endLine might be invalid.  To
    // avoid crashing, we just cap it at the line count.
    endLine = Math.min(endLine, this.codeMirror.lineCount() - 1);

    this.markLineSentinelCharactersForChangedLines_(startLine, endLine);
  };

  RichTextCodeMirror.prototype.markLineSentinelCharactersForChangedLines_ = function(startLine, endLine) {
    // Back up to first list item.
    if (startLine < Number.MAX_VALUE) {
      while(startLine > 0 && this.lineIsListItemOrIndented_(startLine-1)) {
        startLine--;
      }
    }

    // Advance to last list item.
    if (endLine > -1) {
      var lineCount = this.codeMirror.lineCount();
      while (endLine + 1 < lineCount && this.lineIsListItemOrIndented_(endLine+1)) {
        endLine++;
      }
    }

    // keeps track of the list number at each indent level.
    var listNumber = [];

    var cm = this.codeMirror;
    for(var line = startLine; line <= endLine; line++) {
      var text = cm.getLine(line);

      // Remove any existing line classes.
      var lineHandle = cm.getLineHandle(line);
      cm.removeLineClass(lineHandle, "text", ".*");

      if (text.length > 0) {
        var markIndex = text.indexOf(LineSentinelCharacter);
        while (markIndex >= 0) {
          var markStartIndex = markIndex;

          // Find the end of this series of sentinel characters, and remove any existing markers.
          while (markIndex < text.length && text[markIndex] === LineSentinelCharacter) {
            var marks = cm.findMarksAt({ line: line, ch: markIndex });
            for(var i = 0; i < marks.length; i++) {
              if (marks[i].isForLineSentinel) {
                marks[i].clear();
              }
            }

            markIndex++;
          }

          this.markLineSentinelCharacters_(line, markStartIndex, markIndex, listNumber);
          markIndex = text.indexOf(LineSentinelCharacter, markIndex);
        }
      } else {
        // Reset all indents.
        listNumber = [];
      }
    }
    return endLine;
  };

  RichTextCodeMirror.prototype.markLineSentinelCharacters_ = function(line, startIndex, endIndex, listNumber) {
    var cm = this.codeMirror;
    // If the mark is at the beginning of the line and it represents a list element, we need to replace it with
    // the appropriate html element for the list heading.
    var element = null;
    var marker = null;
    var getMarkerLine = function() {
      var span = marker.find();
      return span ? span.from.line : null;
    };

    if (startIndex === 0) {
      var attributes = this.getLineAttributes_(line);
      var listType = attributes[ATTR.LIST_TYPE];
      var indent = attributes[ATTR.LINE_INDENT] || 0;
      if (listType && indent === 0) { indent = 1; }
      while (indent >= listNumber.length) {
        listNumber.push(1);
      }
      if (listType === 'o') {
        element = this.makeOrderedListElement_(listNumber[indent]);
        listNumber[indent]++;
      } else if (listType === 'u') {
        element = this.makeUnorderedListElement_();
        listNumber[indent] = 1;
      } else if (listType === 't') {
        element = this.makeTodoListElement_(false, getMarkerLine);
        listNumber[indent] = 1;
      } else if (listType === 'tc') {
        element = this.makeTodoListElement_(true, getMarkerLine);
        listNumber[indent] = 1;
      }

      var className = this.getClassNameForAttributes_(attributes);
      if (className !== '') {
        this.codeMirror.addLineClass(line, "text", className);
      }

      // Reset deeper indents back to 1.
      listNumber = listNumber.slice(0, indent+1);
    }

    // Create a marker to cover this series of sentinel characters.
    // NOTE: The reason we treat them as a group (one marker for all subsequent sentinel characters instead of
    // one marker for each sentinel character) is that CodeMirror seems to get angry if we don't.
    var markerOptions = { inclusiveLeft: true, collapsed: true };
    if (element) {
      markerOptions.replacedWith = element;
    }
    var marker = cm.markText({line: line, ch: startIndex }, { line: line, ch: endIndex }, markerOptions);
    // track that it's a line-sentinel character so we can identify it later.
    marker.isForLineSentinel = true;
  };

  RichTextCodeMirror.prototype.makeOrderedListElement_ = function(number) {
    return utils.elt('div', number + '.', {
      'class': 'firepad-list-left'
    });
  };

  RichTextCodeMirror.prototype.makeUnorderedListElement_ = function() {
    return utils.elt('div', '\u2022', {
      'class': 'firepad-list-left'
    });
  };

  RichTextCodeMirror.prototype.toggleTodo = function(noRemove) {
    var attribute = ATTR.LIST_TYPE;
    var currentAttributes = this.getCurrentLineAttributes_();
    var newValue;
    if (!(attribute in currentAttributes) || ((currentAttributes[attribute] !== 't') && (currentAttributes[attribute] !== 'tc'))) {
      newValue = 't';
    } else if (currentAttributes[attribute] === 't') {
      newValue = 'tc';
    } else if (currentAttributes[attribute] === 'tc') {
      newValue = noRemove ? 't' : false;
    }
    this.setLineAttribute(attribute, newValue);
  };

  RichTextCodeMirror.prototype.makeTodoListElement_ = function(checked, getMarkerLine) {
    var params = {
      'type': "checkbox",
      'class': 'firepad-todo-left'
    };
    if (checked) params['checked'] = true;
    var el = utils.elt('input', false, params);
    var self = this;
    utils.on(el, 'click', utils.stopEventAnd(function(e) {
      self.codeMirror.setCursor({line: getMarkerLine(), ch: 0});
      self.toggleTodo(true);
    }));
    return el;
  };

  RichTextCodeMirror.prototype.lineIsListItemOrIndented_ = function(lineNum) {
    var attrs = this.getLineAttributes_(lineNum);
    return ((attrs[ATTR.LIST_TYPE] || false) !== false) ||
           ((attrs[ATTR.LINE_INDENT] || 0) !== 0);
  };

  RichTextCodeMirror.prototype.onCursorActivity_ = function() {
    this.updateCurrentAttributes_();
  };

  RichTextCodeMirror.prototype.getCurrentAttributes_ = function() {
    if (!this.currentAttributes_) {
      this.updateCurrentAttributes_();
    }
    return this.currentAttributes_;
  };

  RichTextCodeMirror.prototype.updateCurrentAttributes_ = function() {
    var cm = this.codeMirror;
    var anchor = cm.indexFromPos(cm.getCursor('anchor')), head = cm.indexFromPos(cm.getCursor('head'));
    var pos = head;
    if (anchor > head) { // backwards selection
      // Advance past any newlines or line sentinels.
      while(pos < this.end()) {
        var c = this.getRange(pos, pos+1);
        if (c !== '\n' && c !== LineSentinelCharacter)
          break;
        pos++;
      }
      if (pos < this.end())
        pos++; // since we're going to look at the annotation span to the left to decide what attributes to use.
    } else {
      // Back up before any newlines or line sentinels.
      while(pos > 0) {
        c = this.getRange(pos-1, pos);
        if (c !== '\n' && c !== LineSentinelCharacter)
          break;
        pos--;
      }
    }
    var spans = this.annotationList_.getAnnotatedSpansForPos(pos);
    this.currentAttributes_ = {};

    var attributes = {};
    // Use the attributes to the left unless they're line attributes (in which case use the ones to the right.
    if (spans.length > 0 && (!(ATTR.LINE_SENTINEL in spans[0].annotation.attributes))) {
      attributes = spans[0].annotation.attributes;
    } else if (spans.length > 1) {
      firepad.utils.assert(!(ATTR.LINE_SENTINEL in spans[1].annotation.attributes), "Cursor can't be between two line sentinel characters.");
      attributes = spans[1].annotation.attributes;
    }
    for(var attr in attributes) {
      // Don't copy line or entity attributes.
      if (attr !== 'l' && attr !== 'lt' && attr !== 'li' && attr.indexOf(ATTR.ENTITY_SENTINEL) !== 0) {
        this.currentAttributes_[attr] = attributes[attr];
      }
    }
  };

  RichTextCodeMirror.prototype.getCurrentLineAttributes_ = function() {
    var cm = this.codeMirror;
    var anchor = cm.getCursor('anchor'), head = cm.getCursor('head');
    var line = head.line;
    // If it's a forward selection and the cursor is at the beginning of a line, use the previous line.
    if (head.ch === 0 && anchor.line < head.line) {
      line--;
    }
    return this.getLineAttributes_(line);
  };

  RichTextCodeMirror.prototype.getLineAttributes_ = function(lineNum) {
    var attributes = {};
    var line = this.codeMirror.getLine(lineNum);
    if (line.length > 0 && line[0] === LineSentinelCharacter) {
      var lineStartIndex = this.codeMirror.indexFromPos({ line: lineNum, ch: 0 });
      var spans = this.annotationList_.getAnnotatedSpansForSpan(new Span(lineStartIndex, 1));
      firepad.utils.assert(spans.length === 1);
      for(var attr in spans[0].annotation.attributes) {
        attributes[attr] = spans[0].annotation.attributes[attr];
      }
    }
    return attributes;
  };

  RichTextCodeMirror.prototype.clearAnnotations_ = function() {
    this.annotationList_.updateSpan(new Span(0, this.end()), function(annotation, length) {
      return new RichTextAnnotation({ });
    });
  };

  RichTextCodeMirror.prototype.newline = function() {
    var cm = this.codeMirror;
    var self = this;
    if (!this.emptySelection_()) {
      cm.replaceSelection('\n', 'end', '+input');
    } else {
      var cursorLine = cm.getCursor('head').line;
      var lineAttributes = this.getLineAttributes_(cursorLine);
      var listType = lineAttributes[ATTR.LIST_TYPE];

      if (listType && cm.getLine(cursorLine).length === 1) {
        // They hit enter on a line with just a list heading.  Just remove the list heading.
        this.updateLineAttributes(cursorLine, cursorLine, function(attributes) {
          delete attributes[ATTR.LIST_TYPE];
          delete attributes[ATTR.LINE_INDENT];
        });
      } else {
        cm.replaceSelection('\n', 'end', '+input');

        // Copy line attributes forward.
        this.updateLineAttributes(cursorLine+1, cursorLine+1, function(attributes) {
          for(var attr in lineAttributes) {
            attributes[attr] = lineAttributes[attr];
          }

          // Don't mark new todo items as completed.
          if (listType === 'tc') attributes[ATTR.LIST_TYPE] = 't';
          self.trigger('newLine', {line: cursorLine+1, attr: attributes});
        });
      }
    }
  };

  RichTextCodeMirror.prototype.deleteLeft = function() {
    var cm = this.codeMirror;
    var cursorPos = cm.getCursor('head');
    var lineAttributes = this.getLineAttributes_(cursorPos.line);
    var listType = lineAttributes[ATTR.LIST_TYPE];
    var indent = lineAttributes[ATTR.LINE_INDENT];

    var backspaceAtStartOfLine = this.emptySelection_() && cursorPos.ch === 1;

    if (backspaceAtStartOfLine && listType) {
      // They hit backspace at the beginning of a line with a list heading.  Just remove the list heading.
      this.updateLineAttributes(cursorPos.line, cursorPos.line, function(attributes) {
        delete attributes[ATTR.LIST_TYPE];
        delete attributes[ATTR.LINE_INDENT];
      });
    } else if (backspaceAtStartOfLine && indent && indent > 0) {
      this.updateLineAttributes(cursorPos.line, cursorPos.line, function(attributes) {
        attributes[ATTR.LINE_INDENT]--;
      });
    } else {
      cm.deleteH(-1, "char");
    }
  };

  RichTextCodeMirror.prototype.deleteRight = function() {
    var cm = this.codeMirror;
    var cursorPos = cm.getCursor('head');

    var text = cm.getLine(cursorPos.line);
    var emptyLine = this.areLineSentinelCharacters_(text);
    var nextLineText = (cursorPos.line + 1 < cm.lineCount()) ? cm.getLine(cursorPos.line + 1) : "";
    if (this.emptySelection_() && emptyLine && nextLineText[0] === LineSentinelCharacter) {
      // Delete the empty line but not the line sentinel character on the next line.
      cm.replaceRange('', { line: cursorPos.line, ch: 0 }, { line: cursorPos.line + 1, ch: 0}, '+input');
    } else {
      cm.deleteH(1, "char");
    }
  };

  RichTextCodeMirror.prototype.indent = function() {
    this.updateLineAttributesForSelection(function(attributes) {
      var indent = attributes[ATTR.LINE_INDENT];
      var listType = attributes[ATTR.LIST_TYPE];

      if (indent) {
        attributes[ATTR.LINE_INDENT]++;
      } else if (listType) {
        // lists are implicitly already indented once.
        attributes[ATTR.LINE_INDENT] = 2;
      } else {
        attributes[ATTR.LINE_INDENT] = 1;
      }
    });
  };

  RichTextCodeMirror.prototype.unindent = function() {
    this.updateLineAttributesForSelection(function(attributes) {
      var indent = attributes[ATTR.LINE_INDENT];
      var listType = attributes[ATTR.LIST_TYPE];

      if (indent && indent > 1) {
        attributes[ATTR.LINE_INDENT] = indent - 1;
      } else {
        attributes[ATTR.LINE_INDENT] = false;
        if (listType) {
          // Remove list.
          attributes[ATTR.LIST_TYPE] = false;
        }
      }
    });
  };

  RichTextCodeMirror.prototype.getText = function() {
    return this.codeMirror.getValue().replace(new RegExp(LineSentinelCharacter, "g"), '');
  };

  RichTextCodeMirror.prototype.areLineSentinelCharacters_ = function(text) {
    for(var i = 0; i < text.length; i++) {
      if (text[i] !== LineSentinelCharacter)
        return false;
    }
    return true;
  };

  /**
   * Used for the annotations we store in our AnnotationList.
   * @param attributes
   * @constructor
   */
  function RichTextAnnotation(attributes) {
    this.attributes = attributes || { };
  }

  RichTextAnnotation.prototype.equals = function(other) {
    if (!(other instanceof RichTextAnnotation)) {
      return false;
    }
    var attr;
    for(attr in this.attributes) {
      if (other.attributes[attr] !== this.attributes[attr]) {
        return false;
      }
    }

    for(attr in other.attributes) {
      if (other.attributes[attr] !== this.attributes[attr]) {
        return false;
      }
    }

    return true;
  };

  function emptyAttributes(attributes) {
    for(var attr in attributes) {
      return false;
    }
    return true;
  }

  // Bind a method to an object, so it doesn't matter whether you call
  // object.method() directly or pass object.method as a reference to another
  // function.
  function bind (obj, method) {
    var fn = obj[method];
    obj[method] = function () {
      fn.apply(obj, arguments);
    };
  }

  return RichTextCodeMirror;
})();

var firepad = firepad || { };

// TODO: Can this derive from CodeMirrorAdapter or similar?
firepad.RichTextCodeMirrorAdapter = (function () {
  'use strict';

  var TextOperation = firepad.TextOperation;
  var WrappedOperation = firepad.WrappedOperation;
  var Cursor = firepad.Cursor;

  function RichTextCodeMirrorAdapter (rtcm) {
    this.rtcm = rtcm;
    this.cm = rtcm.codeMirror;

    bind(this, 'onChange');
    bind(this, 'onAttributesChange');
    bind(this, 'onCursorActivity');
    bind(this, 'onFocus');
    bind(this, 'onBlur');

    this.rtcm.on('change', this.onChange);
    this.rtcm.on('attributesChange', this.onAttributesChange);
    this.cm.on('cursorActivity', this.onCursorActivity);
    this.cm.on('focus', this.onFocus);
    this.cm.on('blur', this.onBlur);
  }

  // Removes all event listeners from the CodeMirror instance.
  RichTextCodeMirrorAdapter.prototype.detach = function () {
    this.rtcm.off('change', this.onChange);
    this.rtcm.off('attributesChange', this.onAttributesChange);

    this.cm.off('cursorActivity', this.onCursorActivity);
    this.cm.off('focus', this.onFocus);
    this.cm.off('blur', this.onBlur);
  };

  function cmpPos (a, b) {
    if (a.line < b.line) { return -1; }
    if (a.line > b.line) { return 1; }
    if (a.ch < b.ch)     { return -1; }
    if (a.ch > b.ch)     { return 1; }
    return 0;
  }
  function posEq (a, b) { return cmpPos(a, b) === 0; }
  function posLe (a, b) { return cmpPos(a, b) <= 0; }

  function codemirrorLength (cm) {
    var lastLine = cm.lineCount() - 1;
    return cm.indexFromPos({line: lastLine, ch: cm.getLine(lastLine).length});
  }

  // Converts a CodeMirror change object into a TextOperation and its inverse
  // and returns them as a two-element array.
  RichTextCodeMirrorAdapter.operationFromCodeMirrorChange = function (change, cm) {
    // Approach: Replay the changes, beginning with the most recent one, and
    // construct the operation and its inverse. We have to convert the position
    // in the pre-change coordinate system to an index. We have a method to
    // convert a position in the coordinate system after all changes to an index,
    // namely CodeMirror's `indexFromPos` method. We can use the information of
    // a single change object to convert a post-change coordinate system to a
    // pre-change coordinate system. We can now proceed inductively to get a
    // pre-change coordinate system for all changes in the linked list.
    // A disadvantage of this approach is its complexity `O(n^2)` in the length
    // of the linked list of changes.

    var changes = [], i = 0;
    while (change) {
      changes[i++] = change;
      change = change.next;
    }

    var docEndLength = codemirrorLength(cm);
    var operation    = new TextOperation().retain(docEndLength);
    var inverse      = new TextOperation().retain(docEndLength);

    for (i = changes.length - 1; i >= 0; i--) {
      change = changes[i];

      var fromIndex = change.start;
      var restLength = docEndLength - fromIndex - change.text.length;

      operation = new TextOperation()
          .retain(fromIndex)
          ['delete'](change.removed.length)
          .insert(change.text, change.attributes)
          .retain(restLength)
          .compose(operation);

      inverse = inverse.compose(new TextOperation()
          .retain(fromIndex)
          ['delete'](change.text.length)
          .insert(change.removed, change.removedAttributes)
          .retain(restLength)
      );

      docEndLength += change.removed.length - change.text.length;
    }

    return [operation, inverse];
  };

  // Converts an attributes changed object to an operation and its inverse.
  RichTextCodeMirrorAdapter.operationFromAttributesChange = function (change, cm) {
    var docEndLength = codemirrorLength(cm);

    var operation = new TextOperation(), inverse = new TextOperation();
    var pos = 0;
    while (change) {
      var toRetain = change.start - pos;
      assert(toRetain >= 0); // changes should be in order and non-overlapping.
      operation.retain(toRetain);
      inverse.retain(toRetain);

      var length = change.end - change.start;
      operation.retain(length, change.attributes);
      inverse.retain(length, change.attributesInverse);
      pos = change.start + length;

      change = change.next;
    }

    operation.retain(docEndLength - pos);
    inverse.retain(docEndLength - pos);

    return [operation, inverse];
  };

  // Apply an operation to a CodeMirror instance.
  RichTextCodeMirrorAdapter.applyOperationToCodeMirror = function (operation, rtcm) {

  // HACK: If there are a lot of operations; hide CodeMirror so that it doesn't re-render constantly.
  if (operation.ops.length > 10)
    rtcm.codeMirror.getWrapperElement().setAttribute('style', 'display: none');

  var ops = operation.ops;
  var index = 0; // holds the current index into CodeMirror's content
  for (var i = 0, l = ops.length; i < l; i++) {
    var op = ops[i];
    if (op.isRetain()) {
      if (!emptyAttributes(op.attributes)) {
        rtcm.updateTextAttributes(index, index + op.chars, function(attributes) {
          for(var attr in op.attributes) {
            if (op.attributes[attr] === false) {
              delete attributes[attr];
            } else {
              attributes[attr] = op.attributes[attr];
            }
          }
        }, 'RTCMADAPTER', /*doLineAttributes=*/true);
      }
      index += op.chars;
    } else if (op.isInsert()) {
      rtcm.insertText(index, op.text, op.attributes, 'RTCMADAPTER');
      index += op.text.length;
    } else if (op.isDelete()) {
      rtcm.removeText(index, index + op.chars, 'RTCMADAPTER');
    }
  }

  if (operation.ops.length > 10) {
    rtcm.codeMirror.getWrapperElement().setAttribute('style', '');
    rtcm.codeMirror.refresh();
  }
};

  RichTextCodeMirrorAdapter.prototype.registerCallbacks = function (cb) {
    this.callbacks = cb;
  };

  RichTextCodeMirrorAdapter.prototype.onChange = function (_, change) {
    if (change.origin !== 'RTCMADAPTER') {
      var pair = RichTextCodeMirrorAdapter.operationFromCodeMirrorChange(change, this.cm);
      this.trigger('change', pair[0], pair[1]);
    }
  };

  RichTextCodeMirrorAdapter.prototype.onAttributesChange = function (_, change) {
    if (change.origin !== 'RTCMADAPTER') {
      var pair = RichTextCodeMirrorAdapter.operationFromAttributesChange(change, this.cm);
      this.trigger('change', pair[0], pair[1]);
    }
  };

  RichTextCodeMirrorAdapter.prototype.onCursorActivity =
      RichTextCodeMirrorAdapter.prototype.onFocus = function () {
        this.trigger('cursorActivity');
      };

  RichTextCodeMirrorAdapter.prototype.onBlur = function () {
    if (!this.cm.somethingSelected()) { this.trigger('blur'); }
  };

  RichTextCodeMirrorAdapter.prototype.getValue = function () {
    return this.cm.getValue();
  };

  RichTextCodeMirrorAdapter.prototype.getCursor = function () {
    var cm = this.cm;
    var cursorPos = cm.getCursor();
    var position = cm.indexFromPos(cursorPos);
    var selectionEnd;
    if (cm.somethingSelected()) {
      var startPos = cm.getCursor(true);
      var selectionEndPos = posEq(cursorPos, startPos) ? cm.getCursor(false) : startPos;
      selectionEnd = cm.indexFromPos(selectionEndPos);
    } else {
      selectionEnd = position;
    }

    return new Cursor(position, selectionEnd);
  };

  RichTextCodeMirrorAdapter.prototype.setCursor = function (cursor) {
    this.cm.setSelection(
        this.cm.posFromIndex(cursor.position),
        this.cm.posFromIndex(cursor.selectionEnd)
    );
  };

  RichTextCodeMirrorAdapter.prototype.addStyleRule = function(css) {
    if (typeof document === "undefined" || document === null) {
      return;
    }
    if (!this.addedStyleRules) {
      this.addedStyleRules = {};
      var styleElement = document.createElement('style');
      document.documentElement.getElementsByTagName('head')[0].appendChild(styleElement);
      this.addedStyleSheet = styleElement.sheet;
    }
    if (this.addedStyleRules[css]) {
      return;
    }
    this.addedStyleRules[css] = true;
    return this.addedStyleSheet.insertRule(css, 0);
  };

  RichTextCodeMirrorAdapter.prototype.setOtherCursor = function (cursor, color, clientId) {
    var cursorPos = this.cm.posFromIndex(cursor.position);
    if (typeof color !== 'string' || !color.match(/^#[a-fA-F0-9]{3,6}$/)) {
      return;
    }
    var end = this.rtcm.end();
    if (typeof cursor !== 'object' || typeof cursor.position !== 'number' || typeof cursor.selectionEnd !== 'number') {
      return;
    }
    if (cursor.position < 0 || cursor.position > end || cursor.selectionEnd < 0 || cursor.selectionEnd > end) {
      return;
    }

    if (cursor.position === cursor.selectionEnd) {
      // show cursor
      var cursorCoords = this.cm.cursorCoords(cursorPos);
      var cursorEl = document.createElement('pre');
      cursorEl.className = 'other-client';
      cursorEl.style.borderLeftWidth = '2px';
      cursorEl.style.borderLeftStyle = 'solid';
      cursorEl.innerHTML = '&nbsp;';
      cursorEl.style.borderLeftColor = color;
      cursorEl.style.height = (cursorCoords.bottom - cursorCoords.top) * 0.9 + 'px';
      cursorEl.style.marginTop = (cursorCoords.top - cursorCoords.bottom) + 'px';
      cursorEl.setAttribute('data-clientid', clientId);
      cursorEl.style.zIndex = 0;
      this.cm.addWidget(cursorPos, cursorEl, false);
      return {
        clear: function () {
          var parent = cursorEl.parentNode;
          if (parent) { parent.removeChild(cursorEl); }
        }
      };
    } else {
      // show selection
      var selectionClassName = 'selection-' + color.replace('#', '');
      var rule = '.' + selectionClassName + ' { background: ' + color + '; }';
      this.addStyleRule(rule);

      var fromPos, toPos;
      if (cursor.selectionEnd > cursor.position) {
        fromPos = cursorPos;
        toPos = this.cm.posFromIndex(cursor.selectionEnd);
      } else {
        fromPos = this.cm.posFromIndex(cursor.selectionEnd);
        toPos = cursorPos;
      }
      return this.cm.markText(fromPos, toPos, {
        className: selectionClassName
      });
    }
  };

  RichTextCodeMirrorAdapter.prototype.trigger = function (event) {
    var args = Array.prototype.slice.call(arguments, 1);
    var action = this.callbacks && this.callbacks[event];
    if (action) { action.apply(this, args); }
  };

  RichTextCodeMirrorAdapter.prototype.applyOperation = function (operation) {
    RichTextCodeMirrorAdapter.applyOperationToCodeMirror(operation, this.rtcm);
  };

  RichTextCodeMirrorAdapter.prototype.registerUndo = function (undoFn) {
    this.cm.undo = undoFn;
  };

  RichTextCodeMirrorAdapter.prototype.registerRedo = function (redoFn) {
    this.cm.redo = redoFn;
  };

  RichTextCodeMirrorAdapter.prototype.invertOperation = function(operation) {
    var pos = 0, cm = this.rtcm.codeMirror, spans, i;
    var inverse = new TextOperation();
    for(var opIndex = 0; opIndex < operation.wrapped.ops.length; opIndex++) {
      var op = operation.wrapped.ops[opIndex];
      if (op.isRetain()) {
        if (emptyAttributes(op.attributes)) {
          inverse.retain(op.chars);
          pos += op.chars;
        } else {
          spans = this.rtcm.getAttributeSpans(pos, pos + op.chars);
          for(i = 0; i < spans.length; i++) {
            var inverseAttributes = { };
            for(var attr in op.attributes) {
              var opValue = op.attributes[attr];
              var curValue = spans[i].attributes[attr];

              if (opValue === false) {
                if (curValue) {
                  inverseAttributes[attr] = curValue;
                }
              } else if (opValue !== curValue) {
                inverseAttributes[attr] = curValue || false;
              }
            }

            inverse.retain(spans[i].length, inverseAttributes);
            pos += spans[i].length;
          }
        }
      } else if (op.isInsert()) {
        inverse['delete'](op.text.length);
      } else if (op.isDelete()) {
        var text = cm.getRange(cm.posFromIndex(pos), cm.posFromIndex(pos + op.chars));

        spans = this.rtcm.getAttributeSpans(pos, pos + op.chars);
        var delTextPos = 0;
        for(i = 0; i < spans.length; i++) {
          inverse.insert(text.substr(delTextPos, spans[i].length), spans[i].attributes);
          delTextPos += spans[i].length;
        }

        pos += op.chars;
      }
    }

    return new WrappedOperation(inverse, operation.meta.invert());
  };

  // Throws an error if the first argument is falsy. Useful for debugging.
  function assert (b, msg) {
    if (!b) {
      throw new Error(msg || "assertion error");
    }
  }

  // Bind a method to an object, so it doesn't matter whether you call
  // object.method() directly or pass object.method as a reference to another
  // function.
  function bind (obj, method) {
    var fn = obj[method];
    obj[method] = function () {
      fn.apply(obj, arguments);
    };
  }

  function emptyAttributes(attrs) {
    for(var attr in attrs) {
      return false;
    }
    return true;
  }

  return RichTextCodeMirrorAdapter;
}());

var firepad = firepad || { };

/**
 * Immutable object to represent text formatting.  Formatting can be modified by chaining method calls.
 *
 * @constructor
 * @type {Function}
 */
firepad.Formatting = (function() {
  var ATTR = firepad.AttributeConstants;

  function Formatting(attributes) {
    // Allow calling without new.
    if (!(this instanceof Formatting)) { return new Formatting(attributes); }

    this.attributes = attributes || { };
  }

  Formatting.prototype.cloneWithNewAttribute_ = function(attribute, value) {
    var attributes = { };

    // Copy existing.
    for(var attr in this.attributes) {
      attributes[attr] = this.attributes[attr];
    }

    // Add new one.
    if (value === false) {
      delete attributes[attribute];
    } else {
      attributes[attribute] = value;
    }

    return new Formatting(attributes);
  };

  Formatting.prototype.bold = function(val) {
    return this.cloneWithNewAttribute_(ATTR.BOLD, val);
  };

  Formatting.prototype.italic = function(val) {
    return this.cloneWithNewAttribute_(ATTR.ITALIC, val);
  };

  Formatting.prototype.underline = function(val) {
    return this.cloneWithNewAttribute_(ATTR.UNDERLINE, val);
  };

  Formatting.prototype.strike = function(val) {
    return this.cloneWithNewAttribute_(ATTR.STRIKE, val);
  };

  Formatting.prototype.font = function(font) {
    return this.cloneWithNewAttribute_(ATTR.FONT, font);
  };

  Formatting.prototype.fontSize = function(size) {
    return this.cloneWithNewAttribute_(ATTR.FONT_SIZE, size);
  };

  Formatting.prototype.color = function(color) {
    return this.cloneWithNewAttribute_(ATTR.COLOR, color);
  };

  Formatting.prototype.backgroundColor = function(color) {
    return this.cloneWithNewAttribute_(ATTR.BACKGROUND_COLOR, color);
  };

  return Formatting;
})();

var firepad = firepad || { };

/**
 * Object to represent Formatted text.
 *
 * @type {Function}
 */
firepad.Text = (function() {
  function Text(text, formatting) {
    // Allow calling without new.
    if (!(this instanceof Text)) { return new Text(text, formatting); }

    this.text = text;
    this.formatting = formatting || firepad.Formatting();
  }

  return Text;
})();
var firepad = firepad || { };

/**
 * Immutable object to represent line formatting.  Formatting can be modified by chaining method calls.
 *
 * @constructor
 * @type {Function}
 */
firepad.LineFormatting = (function() {
  var ATTR = firepad.AttributeConstants;

  function LineFormatting(attributes) {
    // Allow calling without new.
    if (!(this instanceof LineFormatting)) { return new LineFormatting(attributes); }

    this.attributes = attributes || { };
    this.attributes[ATTR.LINE_SENTINEL] = true;
  }

  LineFormatting.LIST_TYPE = {
    NONE: false,
    ORDERED: 'o',
    UNORDERED: 'u',
    TODO: 't',
    TODOCHECKED: 'tc' 
  };

  LineFormatting.prototype.cloneWithNewAttribute_ = function(attribute, value) {
    var attributes = { };

    // Copy existing.
    for(var attr in this.attributes) {
      attributes[attr] = this.attributes[attr];
    }

    // Add new one.
    if (value === false) {
      delete attributes[attribute];
    } else {
      attributes[attribute] = value;
    }

    return new LineFormatting(attributes);
  };

  LineFormatting.prototype.indent = function(indent) {
    return this.cloneWithNewAttribute_(ATTR.LINE_INDENT, indent);
  };

  LineFormatting.prototype.align = function(align) {
    return this.cloneWithNewAttribute_(ATTR.LINE_ALIGN, align);
  };

  LineFormatting.prototype.listItem = function(val) {
    firepad.utils.assert(val === false || val === 'u' || val === 'o' || val === 't' || val === 'tc');
    return this.cloneWithNewAttribute_(ATTR.LIST_TYPE, val);
  };

  LineFormatting.prototype.getIndent = function() {
    return this.attributes[ATTR.LINE_INDENT] || 0;
  };

  LineFormatting.prototype.getAlign = function() {
    return this.attributes[ATTR.LINE_ALIGN] || 0;
  };

  LineFormatting.prototype.getListItem = function() {
    return this.attributes[ATTR.LIST_TYPE] || false;
  };

  return LineFormatting;
})();
var firepad = firepad || { };

/**
 * Object to represent Formatted line.
 *
 * @type {Function}
 */
firepad.Line = (function() {
  function Line(textPieces, formatting) {
    // Allow calling without new.
    if (!(this instanceof Line)) { return new Line(textPieces, formatting); }

    if(Object.prototype.toString.call(textPieces) !== '[object Array]') {
      if (typeof textPieces === 'undefined') {
        textPieces = [];
      } else {
        textPieces = [textPieces];
      }
    }

    this.textPieces = textPieces;
    this.formatting = formatting || firepad.LineFormatting();
  }

  return Line;
})();
var firepad = firepad || { };

/**
 * Helper to parse html into Firepad-compatible lines / text.
 * @type {*}
 */
firepad.ParseHtml = (function () {
  var RichTextCodeMirror = firepad.RichTextCodeMirror;
  var LIST_TYPE = firepad.LineFormatting.LIST_TYPE;

  /**
   * Represents the current parse state as an immutable structure.  To create a new ParseState, use
   * the withXXX methods.
   *
   * @param opt_listType
   * @param opt_lineFormatting
   * @param opt_textFormatting
   * @constructor
   */
  function ParseState(opt_listType, opt_lineFormatting, opt_textFormatting) {
    this.listType = opt_listType || LIST_TYPE.UNORDERED;
    this.lineFormatting = opt_lineFormatting || firepad.LineFormatting();
    this.textFormatting = opt_textFormatting || firepad.Formatting();
  }

  ParseState.prototype.withTextFormatting = function(textFormatting) {
    return new ParseState(this.listType, this.lineFormatting, textFormatting);
  };

  ParseState.prototype.withLineFormatting = function(lineFormatting) {
    return new ParseState(this.listType, lineFormatting, this.textFormatting);
  };

  ParseState.prototype.withListType = function(listType) {
    return new ParseState(listType, this.lineFormatting, this.textFormatting);
  };

  ParseState.prototype.withIncreasedIndent = function() {
    var lineFormatting = this.lineFormatting.indent(this.lineFormatting.getIndent() + 1);
    return new ParseState(this.listType, lineFormatting, this.textFormatting);
  };

  ParseState.prototype.withAlign = function(align) {
    var lineFormatting = this.lineFormatting.align(align);
    return new ParseState(this.listType, lineFormatting, this.textFormatting);
  };

  /**
   * Mutable structure representing the current parse output.
   * @constructor
   */
  function ParseOutput() {
    this.lines = [ ];
    this.currentLine = [];
    this.currentLineListItemType = null;
  }

  ParseOutput.prototype.newlineIfNonEmpty = function(state) {
    this.cleanLine_();
    if (this.currentLine.length > 0) {
      this.newline(state);
    }
  };

  ParseOutput.prototype.newlineIfNonEmptyOrListItem = function(state) {
    this.cleanLine_();
    if (this.currentLine.length > 0 || this.currentLineListItemType !== null) {
      this.newline(state);
    }
  };

  ParseOutput.prototype.newline = function(state) {
    this.cleanLine_();
    var lineFormatting = state.lineFormatting;
    if (this.currentLineListItemType !== null) {
      lineFormatting = lineFormatting.listItem(this.currentLineListItemType);
      this.currentLineListItemType = null;
    }

    this.lines.push(firepad.Line(this.currentLine, lineFormatting));
    this.currentLine = [];
  };

  ParseOutput.prototype.makeListItem = function(type) {
    this.currentLineListItemType = type;
  };

  ParseOutput.prototype.isListItem = function() {
    return this.currentLineListItemType !== null;
  };

  ParseOutput.prototype.cleanLine_ = function() {
    // Kinda' a hack, but we remove leading and trailing spaces (since these aren't significant in html) and
    // replaces nbsp's with normal spaces.
    if (this.currentLine.length > 0) {
      var last = this.currentLine.length - 1;
      this.currentLine[0].text = this.currentLine[0].text.replace(/^ +/, '');
      this.currentLine[last].text = this.currentLine[last].text.replace(/ +$/g, '');
      for(var i = 0; i < this.currentLine.length; i++) {
        this.currentLine[i].text = this.currentLine[i].text.replace(/\u00a0/g, ' ');
      }
    }
    // If after stripping trailing whitespace, there's nothing left, clear currentLine out.
    if (this.currentLine.length === 1 && this.currentLine[0].text === '') {
      this.currentLine = [];
    }
  };

  var entityManager_;
  function parseHtml(html, entityManager) {
    // Create DIV with HTML (as a convenient way to parse it).
    var div = document.createElement('div');
    div.innerHTML = html;

    // HACK until I refactor this.
    entityManager_ = entityManager;

    var output = new ParseOutput();
    var state = new ParseState();
    parseNode(div, state, output);

    return output.lines;
  }

  // Fix IE8.
  var Node = Node || {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3
  };

  function parseNode(node, state, output) {
    // Give entity manager first crack at it.
    if (node.nodeType === Node.ELEMENT_NODE) {
      var entity = entityManager_.fromElement(node);
      if (entity) {
        output.currentLine.push(new firepad.Text(
            RichTextCodeMirror.EntitySentinelCharacter,
            new firepad.Formatting(entity.toAttributes())
        ));
        return;
      }
    }

    switch (node.nodeType) {
      case Node.TEXT_NODE:
        // This probably isn't exactly right, but mostly works...
        var text = node.nodeValue.replace(/[ \n\t]+/g, ' ');
        output.currentLine.push(firepad.Text(text, state.textFormatting));
        break;
      case Node.ELEMENT_NODE:
        var style = node.getAttribute('style') || '';
        state = parseStyle(state, style);
        switch (node.nodeName.toLowerCase()) {
          case 'div':
          case 'h1':
          case 'h2':
          case 'h3':
          case 'p':
            output.newlineIfNonEmpty(state);
            parseChildren(node, state, output);
            output.newlineIfNonEmpty(state);
            break;
          case 'center':
            state = state.withAlign('center');
            output.newlineIfNonEmpty(state);
            parseChildren(node, state.withAlign('center'), output);
            output.newlineIfNonEmpty(state);
            break;
          case 'b':
          case 'strong':
            parseChildren(node, state.withTextFormatting(state.textFormatting.bold(true)), output);
            break;
          case 'u':
            parseChildren(node, state.withTextFormatting(state.textFormatting.underline(true)), output);
            break;
          case 'i':
          case 'em':
            parseChildren(node, state.withTextFormatting(state.textFormatting.italic(true)), output);
            break;
          case 's':
            parseChildren(node, state.withTextFormatting(state.textFormatting.strike(true)), output);
            break;
          case 'font':
            var face = node.getAttribute('face');
            var color = node.getAttribute('color');
            var size = parseInt(node.getAttribute('size'));
            if (face) { state = state.withTextFormatting(state.textFormatting.font(face)); }
            if (color) { state = state.withTextFormatting(state.textFormatting.color(color)); }
            if (size) { state = state.withTextFormatting(state.textFormatting.fontSize(size)); }
            parseChildren(node, state, output);
            break;
          case 'br':
            output.newline(state);
            break;
          case 'ul':
            output.newlineIfNonEmptyOrListItem(state);
            var listType = node.getAttribute('class') === 'firepad-todo' ? LIST_TYPE.TODO : LIST_TYPE.UNORDERED;
            parseChildren(node, state.withListType(listType).withIncreasedIndent(), output);
            output.newlineIfNonEmpty(state);
            break;
          case 'ol':
            output.newlineIfNonEmptyOrListItem(state);
            parseChildren(node, state.withListType(LIST_TYPE.ORDERED).withIncreasedIndent(), output);
            output.newlineIfNonEmpty(state);
            break;
          case 'li':
            parseListItem(node, state, output);
            break;
          case 'style': // ignore.
            break;
          default:
            parseChildren(node, state, output);
            break;
        }
        break;
      default:
        // Ignore other nodes (comments, etc.)
        break;
    }
  }

  function parseChildren(node, state, output) {
    if (node.hasChildNodes()) {
      for(var i = 0; i < node.childNodes.length; i++) {
        parseNode(node.childNodes[i], state, output);
      }
    }
  }

  function parseListItem(node, state, output) {
    // Note: <li> is weird:
    // * Only the first line in the <li> tag should be a list item (i.e. with a bullet or number next to it).
    // * <li></li> should create an empty list item line; <li><ol><li></li></ol></li> should create two.

    output.newlineIfNonEmptyOrListItem(state);

    var listType = (node.getAttribute('class') === 'firepad-checked') ? LIST_TYPE.TODOCHECKED : state.listType;
    output.makeListItem(listType);
    var oldLine = output.currentLine;

    parseChildren(node, state, output);

    if (oldLine === output.currentLine || output.currentLine.length > 0) {
      output.newline(state);
    }
  }

  function parseStyle(state, styleString) {
    var textFormatting = state.textFormatting;
    var lineFormatting = state.lineFormatting;
    var styles = styleString.split(';');
    for(var i = 0; i < styles.length; i++) {
      var stylePieces = styles[i].split(':');
      if (stylePieces.length !== 2)
        continue;
      var prop = firepad.utils.trim(stylePieces[0]).toLowerCase();
      var val = firepad.utils.trim(stylePieces[1]).toLowerCase();
      switch (prop) {
        case 'text-decoration':
          var underline = val.indexOf('underline') >= 0;
          var strike = val.indexOf('line-through') >= 0;
          textFormatting = textFormatting.underline(underline).strike(strike);
          break;
        case 'font-weight':
          var bold = (val === 'bold') || parseInt(val) >= 600;
          textFormatting = textFormatting.bold(bold);
          break;
        case 'font-style':
          var italic = (val === 'italic' || val === 'oblique');
          textFormatting = textFormatting.italic(italic);
          break;
        case 'color':
          textFormatting = textFormatting.color(val);
          break;
        case 'background-color':
          textFormatting = textFormatting.backgroundColor(val);
          break;
        case 'text-align':
          lineFormatting = lineFormatting.align(val);
          break;
        case 'font-size':
          var size = null;
          var allowedValues = ['px','pt','%','em','xx-small','x-small','small','medium','large','x-large','xx-large','smaller','larger'];
          if (firepad.utils.stringEndsWith(val, allowedValues)) {
            size = val;
          }
          else if (parseInt(val)) {
            size = parseInt(val)+'px';
          }
          if (size) {
            textFormatting = textFormatting.fontSize(size);
          }
          break;
        case 'font-family':
          var font = firepad.utils.trim(val.split(',')[0]); // get first font.
          font = font.replace(/['"]/g, ''); // remove quotes.
          font = font.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() });
          textFormatting = textFormatting.font(font);
          break;
      }
    }
    return state.withLineFormatting(lineFormatting).withTextFormatting(textFormatting);
  }

  return parseHtml;
})();

var firepad = firepad || { };

firepad.Firepad = (function(global) {
  if (!firepad.RichTextCodeMirrorAdapter) {
    throw new Error("Oops! It looks like you're trying to include lib/firepad.js directly.  This is actually one of many source files that make up firepad.  You want dist/firepad.js instead.");
  }
  var RichTextCodeMirrorAdapter = firepad.RichTextCodeMirrorAdapter;
  var RichTextCodeMirror = firepad.RichTextCodeMirror;
  var RichTextToolbar = firepad.RichTextToolbar;
  var ACEAdapter = firepad.ACEAdapter;
  var FirebaseAdapter = firepad.FirebaseAdapter;
  var EditorClient = firepad.EditorClient;
  var EntityManager = firepad.EntityManager;
  var ATTR = firepad.AttributeConstants;
  var utils = firepad.utils;
  var LIST_TYPE = firepad.LineFormatting.LIST_TYPE;
  var CodeMirror = global.CodeMirror;
  var ace = global.ace;

  function Firepad(ref, place, options) {
    if (!(this instanceof Firepad)) { return new Firepad(ref, place, options); }

    if (!CodeMirror && !ace) {
      throw new Error('Couldn\'t find CodeMirror or ACE.  Did you forget to include codemirror.js or ace.js?');
    }

    if (CodeMirror && place instanceof CodeMirror) {
      this.codeMirror_ = this.editor_ = place;
      var curValue = this.codeMirror_.getValue();
      if (curValue !== '') {
        throw new Error("Can't initialize Firepad with a CodeMirror instance that already contains text.");
      }
    } else if (ace && place && place.session instanceof ace.EditSession) {
      this.ace_ = this.editor_ = place;
      curValue = this.ace_.getValue();
      if (curValue !== '') {
        throw new Error("Can't initialize Firepad with an ACE instance that already contains text.");
      }
    } else {
      this.codeMirror_ = this.editor_ = new CodeMirror(place);
    }

    var editorWrapper = this.codeMirror_ ? this.codeMirror_.getWrapperElement() : this.ace_.container;
    this.firepadWrapper_ = utils.elt("div", null, { 'class': 'firepad' });
    editorWrapper.parentNode.replaceChild(this.firepadWrapper_, editorWrapper);
    this.firepadWrapper_.appendChild(editorWrapper);

    // Don't allow drag/drop because it causes issues.  See https://github.com/firebase/firepad/issues/36
    utils.on(editorWrapper, 'dragstart', utils.stopEvent);

    // Provide an easy way to get the firepad instance associated with this CodeMirror instance.
    this.editor_.firepad = this;

    this.options_ = options || { };

    if (this.getOption('richTextShortcuts', false)) {
      if (!CodeMirror.keyMap['richtext']) {
        this.initializeKeyMap_();
      }
      this.codeMirror_.setOption('keyMap', 'richtext');
      this.firepadWrapper_.className += ' firepad-richtext';
    }

    this.imageInsertionUI = this.getOption('imageInsertionUI', true);

    if (this.getOption('richTextToolbar', false)) {
      this.addToolbar_();
      this.firepadWrapper_.className += ' firepad-richtext firepad-with-toolbar';
    }

    this.addPoweredByLogo_();

    // Now that we've mucked with CodeMirror, refresh it.
    if (this.codeMirror_)
      this.codeMirror_.refresh();

    var userId = this.getOption('userId', ref.push().name());
    var userColor = this.getOption('userColor', colorFromUserId(userId));

    this.entityManager_ = new EntityManager();
    this.registerBuiltinEntities_();

    this.firebaseAdapter_ = new FirebaseAdapter(ref, userId, userColor);
    if (this.codeMirror_) {
      this.richTextCodeMirror_ = new RichTextCodeMirror(this.codeMirror_, this.entityManager_, { cssPrefix: 'firepad-' });
      this.editorAdapter_ = new RichTextCodeMirrorAdapter(this.richTextCodeMirror_);
    } else {
      this.editorAdapter_ = new ACEAdapter(this.ace_);
    }
    this.client_ = new EditorClient(this.firebaseAdapter_, this.editorAdapter_);

    var self = this;
    this.firebaseAdapter_.on('cursor', function() {
      self.trigger.apply(self, ['cursor'].concat([].slice.call(arguments)));
    });

    if (this.codeMirror_) {
      this.richTextCodeMirror_.on('newLine', function() {
        self.trigger.apply(self, ['newLine'].concat([].slice.call(arguments)));
      });
    }

    this.firebaseAdapter_.on('ready', function() {
      self.ready_ = true;
      if (this.ace_)
        this.editorAdapter_.grabDocumentState();
      self.trigger('ready');
    });

    // Hack for IE8 to make font icons work more reliably.
    // http://stackoverflow.com/questions/9809351/ie8-css-font-face-fonts-only-working-for-before-content-on-over-and-sometimes
    if (navigator.appName == 'Microsoft Internet Explorer' && navigator.userAgent.match(/MSIE 8\./)) {
      window.onload = function() {
        var head = document.getElementsByTagName('head')[0],
          style = document.createElement('style');
        style.type = 'text/css';
        style.styleSheet.cssText = ':before,:after{content:none !important;}';
        head.appendChild(style);
        setTimeout(function() {
          head.removeChild(style);
        }, 0);
      };
    }
  }
  utils.makeEventEmitter(Firepad);

  // For readability, these are the primary "constructors", even though right now they're just aliases for Firepad.
  Firepad.fromCodeMirror = Firepad;
  Firepad.fromACE = Firepad;

  Firepad.prototype.dispose = function() {
    this.zombie_ = true; // We've been disposed.  No longer valid to do anything.

    // Unwrap the editor.
    var editorWrapper = this.codeMirror_ ? this.codeMirror_.getWrapperElement() : this.ace_.container;
    this.firepadWrapper_.removeChild(editorWrapper);
    this.firepadWrapper_.parentNode.replaceChild(editorWrapper, this.firepadWrapper_);

    this.editor_.firepad = null;

    if (this.codeMirror_ && this.codeMirror_.getOption('keyMap') === 'richtext') {
      this.codeMirror_.setOption('keyMap', 'default');
    }

    this.firebaseAdapter_.dispose();
    this.editorAdapter_.detach();
    if (this.richTextCodeMirror_)
      this.richTextCodeMirror_.detach();
  };

  Firepad.prototype.setUserId = function(userId) {
    this.firebaseAdapter_.setUserId(userId);
  };

  Firepad.prototype.setUserColor = function(color) {
    this.firebaseAdapter_.setColor(color);
  };

  Firepad.prototype.getText = function() {
    this.assertReady_('getText');
    if (this.codeMirror_)
      return this.richTextCodeMirror_.getText();
    else
      return this.ace_.getSession().getDocument().getValue();
  };

  Firepad.prototype.setText = function(textPieces) {
    if (this.ace_) {
      return this.ace_.getSession().getDocument().setValue(textPieces);
    } else {
      // HACK: Hide CodeMirror during setText to prevent lots of extra renders.
      this.codeMirror_.getWrapperElement().setAttribute('style', 'display: none');
      this.codeMirror_.setValue("");
      this.insertText(0, textPieces);
      this.codeMirror_.getWrapperElement().setAttribute('style', '');
      this.codeMirror_.refresh();
    }
  };

  Firepad.prototype.insertTextAtCursor = function(textPieces) {
    this.insertText(this.codeMirror_.indexFromPos(this.codeMirror_.getCursor()), textPieces);
  };

  Firepad.prototype.insertText = function(index, textPieces) {
    utils.assert(!this.ace_, "Not supported for ace yet.");
    this.assertReady_('insertText');

    // Wrap it in an array if it's not already.
    if(Object.prototype.toString.call(textPieces) !== '[object Array]') {
      textPieces = [textPieces];
    }

    // TODO: Batch this all into a single operation.
    // HACK: We should check if we're actually at the beginning of a line; but checking for index == 0 is sufficient
    // for the setText() case.
    var atNewLine = (index === 0), self = this;

    function insert(string, attributes) {
      self.richTextCodeMirror_.insertText(index, string, attributes || null);
      index += string.length;
      atNewLine = string[string.length-1] === '\n';
    }

    function insertTextOrString(x) {
      if (x instanceof firepad.Text) {
        insert(x.text, x.formatting.attributes);
      } else if (typeof x === 'string') {
        insert(x);
      } else {
        console.error("Can't insert into firepad", x);
        throw "Can't insert into firepad: " + x;
      }
    }

    function insertLine(line) {
      // HACK: We should probably force a newline if there isn't one already.  But due to
      // the way this is used for inserting HTML, we end up inserting a "line" in the middle
      // of text, in which case we don't want to actually insert a newline.
      if (atNewLine)
        insert(RichTextCodeMirror.LineSentinelCharacter, line.formatting.attributes);

      for(var i = 0; i < line.textPieces.length; i++) {
        insertTextOrString(line.textPieces[i]);
      }

      insert('\n');
    }

    for(var i = 0; i < textPieces.length; i++) {
      if (textPieces[i] instanceof firepad.Line) {
        insertLine(textPieces[i]);
      } else {
        insertTextOrString(textPieces[i]);
      }
    }
  };

  Firepad.prototype.getOperationForSpan = function(start, end) {
    var text = this.richTextCodeMirror_.getRange(start, end);
    var spans = this.richTextCodeMirror_.getAttributeSpans(start, end);
    var pos = 0;
    var op = new firepad.TextOperation();
    for(var i = 0; i < spans.length; i++) {
      op.insert(text.substr(pos, spans[i].length), spans[i].attributes);
      pos += spans[i].length;
    }
    return op;
  };


  Firepad.TODO_STYLE = '<style>ul.firepad-todo { list-style: none; margin-left: 0; padding-left: 0; } ul.firepad-todo > li { padding-left: 1em; text-indent: -1em; } ul.firepad-todo > li:before { content: "\\2610"; padding-right: 5px; } ul.firepad-todo > li.firepad-checked:before { content: "\\2611"; padding-right: 5px; }</style>\n';

  Firepad.prototype.getHtml = function() {
    return this.getHtmlFromRange(null, null);
  };

  Firepad.prototype.getHtmlFromSelection = function() {
    var startPos = this.codeMirror_.getCursor('start'), endPos = this.codeMirror_.getCursor('end');
    var startIndex = this.codeMirror_.indexFromPos(startPos), endIndex = this.codeMirror_.indexFromPos(endPos);
    return this.getHtmlFromRange(startIndex, endIndex);
  };

  Firepad.prototype.getHtmlFromRange = function(start, end) {
    var doc = (start != null && end != null) ? this.getOperationForSpan(start, end) : this.firebaseAdapter_.getDocument();
    var html = '', newLine = true;
    html += Firepad.EXPORT_HTML_STYLE;

    function open(listType) {
      return (listType === LIST_TYPE.ORDERED) ? '<ol>' :
             (listType === LIST_TYPE.UNORDERED) ? '<ul>' :
             '<ul class="firepad-todo">';
    }

    function close(listType) {
      return (listType === LIST_TYPE.ORDERED) ? '</ol>' : '</ul>';
    }

    var listTypeStack = [];
    var inListItem = false;
    var firstLine = true;
    var emptyLine = true;
    var i = 0, op = doc.ops[i];
    var usesTodo = false;
    while(op) {
      utils.assert(op.isInsert());
      var attrs = op.attributes;

      if (newLine) {
        newLine = false;

        var indent = 0, listType = null, lineAlign = 'left';
        if (ATTR.LINE_SENTINEL in attrs) {
          indent = attrs[ATTR.LINE_INDENT] || 0;
          listType = attrs[ATTR.LIST_TYPE] || null;
          lineAlign = attrs[ATTR.LINE_ALIGN] || 'left';
        }
        if (listType) {
          indent = indent || 1; // lists are automatically indented at least 1.
        }

        if (inListItem) {
          html += '</li>';
          inListItem = false;
        } else if (!firstLine) {
          if (emptyLine) {
            html += '<br/>';
          }
          html += '</div>';
        }
        firstLine = false;

        // Close any extra lists.
        function compatibleListType(l1, l2) {
          return (l1 === l2) ||
              (l1 === LIST_TYPE.TODO && l2 === LIST_TYPE.TODOCHECKED) ||
              (l1 === LIST_TYPE.TODOCHECKED && l2 === LIST_TYPE.TODO);
        }
        utils.assert(indent >= 0, "Indent must not be negative.");
        while (listTypeStack.length > indent ||
            (indent === listTypeStack.length && listType !== null && !compatibleListType(listType, listTypeStack[listTypeStack.length - 1]))) {
          html += close(listTypeStack.pop());
        }

        // Open any needed lists.
        while (listTypeStack.length < indent) {
          var toOpen = listType || LIST_TYPE.UNORDERED; // default to unordered lists for indenting non-list-item lines.
          usesTodo = listType == LIST_TYPE.TODO || listType == LIST_TYPE.TODOCHECKED || usesTodo;
          html += open(toOpen);
          listTypeStack.push(toOpen);
        }

        var style = (lineAlign !== 'left') ? ' style="text-align:' + lineAlign + '"': '';
        if (listType) {
          var clazz = '';
          switch (listType)
          {
            case LIST_TYPE.TODOCHECKED:
              clazz = ' class="firepad-checked"';
              break;
            case LIST_TYPE.TODO:
              clazz = ' class="firepad-unchecked"';
              break;
          }
          html += "<li" + clazz + style + ">";
          inListItem = true;
        } else {
          // start line div.
          html += '<div' + style + '>';
        }
        emptyLine = true;
      }

      if (ATTR.LINE_SENTINEL in attrs) {
        op = doc.ops[++i];
        continue;
      }

      if (ATTR.ENTITY_SENTINEL in attrs) {
        for(var j = 0; j < op.text.length; j++) {
          var entity = firepad.Entity.fromAttributes(attrs);
          var element = this.entityManager_.exportToElement(entity);
          html += element.outerHTML;
        }

        op = doc.ops[++i];
        continue;
      }

      var prefix = '', suffix = '';
      for(var attr in attrs) {
        var value = attrs[attr];
        var start, end;
        if (attr === ATTR.BOLD || attr === ATTR.ITALIC || attr === ATTR.UNDERLINE || attr === ATTR.STRIKE) {
          utils.assert(value === true);
          start = end = attr;
        } else if (attr === ATTR.FONT_SIZE) {
          start = 'span style="font-size: ' + value;
          start += (typeof value !== "string" || value.indexOf("px", value.length - 2) === -1) ? 'px"' : '"';
          end = 'span';
        } else if (attr === ATTR.FONT) {
          start = 'span style="font-family: ' + value + '"';
          end = 'span';
        } else if (attr === ATTR.COLOR) {
          start = 'span style="color: ' + value + '"';
          end = 'span';
        } else if (attr === ATTR.BACKGROUND_COLOR) {
          start = 'span style="background-color: ' + value + '"';
          end = 'span';
        }
        else {
          utils.log(false, "Encountered unknown attribute while rendering html: " + attr);
        }
        if (start) prefix += '<' + start + '>';
        if (end) suffix = '</' + end + '>' + suffix;
      }

      var text = op.text;
      var newLineIndex = text.indexOf('\n');
      if (newLineIndex >= 0) {
        newLine = true;
        if (newLineIndex < text.length - 1) {
          // split op.
          op = new firepad.TextOp('insert', text.substr(newLineIndex+1), attrs);
        } else {
          op = doc.ops[++i];
        }
        text = text.substr(0, newLineIndex);
      } else {
        op = doc.ops[++i];
      }

      // Replace leading, trailing, and consecutive spaces with nbsp's to make sure they're preserved.
      text = text.replace(/  +/g, function(str) {
        return new Array(str.length + 1).join('\u00a0');
      }).replace(/^ /, '\u00a0').replace(/ $/, '\u00a0');
      if (text.length > 0) {
        emptyLine = false;
      }

      html += prefix + this.textToHtml_(text) + suffix;
    }

    if (inListItem) {
      html += '</li>';
    } else if (!firstLine) {
      if (emptyLine) {
        html += '&nbsp;';
      }
      html += '</div>';
    }

    // Close any extra lists.
    while (listTypeStack.length > 0) {
      html += close(listTypeStack.pop());
    }

    if (usesTodo) {
      html =  Firepad.TODO_STYLE + html;
    }

    return html;
  };

  Firepad.EXPORT_HTML_STYLE = '';

  Firepad.prototype.textToHtml_ = function(text) {
    return text.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\u00a0/g, '&nbsp;')
  };

  Firepad.prototype.insertHtml = function (index, html) {
    var lines = firepad.ParseHtml(html, this.entityManager_);
    this.insertText(index, lines);
  };

  Firepad.prototype.insertHtmlAtCursor = function (html) {
    this.insertHtml(this.codeMirror_.indexFromPos(this.codeMirror_.getCursor()), html);
  };

  Firepad.prototype.setHtml = function (html) {
    var lines = firepad.ParseHtml(html, this.entityManager_);
    this.setText(lines);
  };

  Firepad.prototype.isHistoryEmpty = function() {
    this.assertReady_('isHistoryEmpty');
    return this.firebaseAdapter_.isHistoryEmpty();
  };

  Firepad.prototype.bold = function() {
    this.richTextCodeMirror_.toggleAttribute(ATTR.BOLD);
    this.codeMirror_.focus();
  };

  Firepad.prototype.italic = function() {
    this.richTextCodeMirror_.toggleAttribute(ATTR.ITALIC);
    this.codeMirror_.focus();
  };

  Firepad.prototype.underline = function() {
    this.richTextCodeMirror_.toggleAttribute(ATTR.UNDERLINE);
    this.codeMirror_.focus();
  };

  Firepad.prototype.strike = function() {
    this.richTextCodeMirror_.toggleAttribute(ATTR.STRIKE);
    this.codeMirror_.focus();
  };

  Firepad.prototype.fontSize = function(size) {
    this.richTextCodeMirror_.setAttribute(ATTR.FONT_SIZE, size);
    this.codeMirror_.focus();
  };

  Firepad.prototype.font = function(font) {
    this.richTextCodeMirror_.setAttribute(ATTR.FONT, font);
    this.codeMirror_.focus();
  };

  Firepad.prototype.color = function(color) {
    this.richTextCodeMirror_.setAttribute(ATTR.COLOR, color);
    this.codeMirror_.focus();
  };

  Firepad.prototype.highlight = function() {
    this.richTextCodeMirror_.toggleAttribute(ATTR.BACKGROUND_COLOR, 'rgba(255,255,0,.65)');
    this.codeMirror_.focus();
  };

  Firepad.prototype.align = function(alignment) {
    if (alignment !== 'left' && alignment !== 'center' && alignment !== 'right') {
      throw new Error('align() must be passed "left", "center", or "right".');
    }
    this.richTextCodeMirror_.setLineAttribute(ATTR.LINE_ALIGN, alignment);
    this.codeMirror_.focus();
  };

  Firepad.prototype.orderedList = function() {
    this.richTextCodeMirror_.toggleLineAttribute(ATTR.LIST_TYPE, 'o');
    this.codeMirror_.focus();
  };

  Firepad.prototype.unorderedList = function() {
    this.richTextCodeMirror_.toggleLineAttribute(ATTR.LIST_TYPE, 'u');
    this.codeMirror_.focus();
  };

  Firepad.prototype.todo = function() {
    this.richTextCodeMirror_.toggleTodo();
    this.codeMirror_.focus();
  };

  Firepad.prototype.newline = function() {
    this.richTextCodeMirror_.newline();
  };

  Firepad.prototype.deleteLeft = function() {
    this.richTextCodeMirror_.deleteLeft();
  };

  Firepad.prototype.deleteRight = function() {
    this.richTextCodeMirror_.deleteRight();
  };

  Firepad.prototype.indent = function() {
    this.richTextCodeMirror_.indent();
    this.codeMirror_.focus();
  };

  Firepad.prototype.unindent = function() {
    this.richTextCodeMirror_.unindent();
    this.codeMirror_.focus();
  };

  Firepad.prototype.undo = function() {
    this.codeMirror_.undo();
  };

  Firepad.prototype.redo = function() {
    this.codeMirror_.redo();
  };

  Firepad.prototype.insertEntity = function(type, info, origin) {
    this.richTextCodeMirror_.insertEntityAtCursor(type, info, origin);
  };

  Firepad.prototype.insertEntityAt = function(index, type, info, origin) {
    this.richTextCodeMirror_.insertEntityAt(index, type, info, origin);
  };

  Firepad.prototype.registerEntity = function(type, options) {
    this.entityManager_.register(type, options);
  };

  Firepad.prototype.getOption = function(option, def) {
    return (option in this.options_) ? this.options_[option] : def;
  };

  Firepad.prototype.assertReady_ = function(funcName) {
    if (!this.ready_) {
      throw new Error('You must wait for the "ready" event before calling ' + funcName + '.');
    }
    if (this.zombie_) {
      throw new Error('You can\'t use a Firepad after calling dispose()!');
    }
  };

  Firepad.prototype.makeImageDialog_ = function() {
    this.makeDialog_('img', 'Insert image url');
  };

  Firepad.prototype.makeDialog_ = function(id, placeholder) {
   var self = this;

   var hideDialog = function() {
     var dialog = document.getElementById('overlay');
     dialog.style.visibility = "hidden";
     self.firepadWrapper_.removeChild(dialog);
   };

   var cb = function() {
     var dialog = document.getElementById('overlay');
     dialog.style.visibility = "hidden";
     var src = document.getElementById(id).value;
     if (src !== null)
       self.insertEntity(id, { 'src': src });
     self.firepadWrapper_.removeChild(dialog);
   };

   var input = utils.elt('input', null, { 'class':'firepad-dialog-input', 'id':id, 'type':'text', 'placeholder':placeholder, 'autofocus':'autofocus' });

   var submit = utils.elt('a', 'Submit', { 'class': 'firepad-btn', 'id':'submitbtn' });
   utils.on(submit, 'click', utils.stopEventAnd(cb));

   var cancel = utils.elt('a', 'Cancel', { 'class': 'firepad-btn' });
   utils.on(cancel, 'click', utils.stopEventAnd(hideDialog));

   var buttonsdiv = utils.elt('div', [submit, cancel], { 'class':'firepad-btn-group' });

   var div = utils.elt('div', [input, buttonsdiv], { 'class':'firepad-dialog-div' });
   var dialog = utils.elt('div', [div], { 'class': 'firepad-dialog', id:'overlay' });

   this.firepadWrapper_.appendChild(dialog);
  };

  Firepad.prototype.addToolbar_ = function() {
    this.toolbar = new RichTextToolbar(this.imageInsertionUI);

    this.toolbar.on('undo', this.undo, this);
    this.toolbar.on('redo', this.redo, this);
    this.toolbar.on('bold', this.bold, this);
    this.toolbar.on('italic', this.italic, this);
    this.toolbar.on('underline', this.underline, this);
    this.toolbar.on('strike', this.strike, this);
    this.toolbar.on('font-size', this.fontSize, this);
    this.toolbar.on('font', this.font, this);
    this.toolbar.on('color', this.color, this);
    this.toolbar.on('left', function() { this.align('left')}, this);
    this.toolbar.on('center', function() { this.align('center')}, this);
    this.toolbar.on('right', function() { this.align('right')}, this);
    this.toolbar.on('ordered-list', this.orderedList, this);
    this.toolbar.on('unordered-list', this.unorderedList, this);
    this.toolbar.on('todo-list', this.todo, this);
    this.toolbar.on('indent-increase', this.indent, this);
    this.toolbar.on('indent-decrease', this.unindent, this);
    this.toolbar.on('insert-image', this.makeImageDialog_, this);

    this.firepadWrapper_.insertBefore(this.toolbar.element(), this.firepadWrapper_.firstChild);
  };

  Firepad.prototype.registerBuiltinEntities_ = function() {
    var attrs = ['src', 'alt', 'width', 'height', 'style', 'class'];
    this.registerEntity('img', {
      render: function(info) {
        utils.assert(info.src, "image entity should have 'src'!");
        var attrs = ['src', 'alt', 'width', 'height', 'style', 'class'];
        var html = '<img ';
        for(var i = 0; i < attrs.length; i++) {
          var attr = attrs[i];
          if (attr in info) {
            html += ' ' + attr + '="' + info[attr] + '"';
          }
        }
        html += ">";
        return html;
      },
      fromElement: function(element) {
        var info = {};
        for(var i = 0; i < attrs.length; i++) {
          var attr = attrs[i];
          if (element.hasAttribute(attr)) {
            info[attr] = element.getAttribute(attr);
          }
        }
        return info;
      }
    });
  };

  Firepad.prototype.addPoweredByLogo_ = function() {
    var poweredBy = utils.elt('a', null, { 'class': 'powered-by-firepad'} );
    poweredBy.setAttribute('href', 'http://www.firepad.io/');
    poweredBy.setAttribute('target', '_blank');
    this.firepadWrapper_.appendChild(poweredBy)
  };

  Firepad.prototype.initializeKeyMap_ = function() {
    function binder(fn) {
      return function(cm) {
        // HACK: CodeMirror will often call our key handlers within a cm.operation(), and that
        // can mess us up (we rely on events being triggered synchronously when we make CodeMirror
        // edits).  So to escape any cm.operation(), we do a setTimeout.
        setTimeout(function() {
          fn.call(cm.firepad);
        }, 0);
      }
    }

    CodeMirror.keyMap["richtext"] = {
      "Ctrl-B": binder(this.bold),
      "Cmd-B": binder(this.bold),
      "Ctrl-I": binder(this.italic),
      "Cmd-I": binder(this.italic),
      "Ctrl-U": binder(this.underline),
      "Cmd-U": binder(this.underline),
      "Ctrl-H": binder(this.highlight),
      "Cmd-H": binder(this.highlight),
      "Enter": binder(this.newline),
      "Delete": binder(this.deleteRight),
      "Backspace": binder(this.deleteLeft),
      "Tab": binder(this.indent),
      "Shift-Tab": binder(this.unindent),
      fallthrough: ['default']
    };
  };

  function colorFromUserId (userId) {
    var a = 1;
    for (var i = 0; i < userId.length; i++) {
      a = 17 * (a+userId.charCodeAt(i)) % 360;
    }
    var hue = a/360;

    return hsl2hex(hue, 1, 0.85);
  }

  function rgb2hex (r, g, b) {
    function digits (n) {
      var m = Math.round(255*n).toString(16);
      return m.length === 1 ? '0'+m : m;
    }
    return '#' + digits(r) + digits(g) + digits(b);
  }

  function hsl2hex (h, s, l) {
    if (s === 0) { return rgb2hex(l, l, l); }
    var var2 = l < 0.5 ? l * (1+s) : (l+s) - (s*l);
    var var1 = 2 * l - var2;
    var hue2rgb = function (hue) {
      if (hue < 0) { hue += 1; }
      if (hue > 1) { hue -= 1; }
      if (6*hue < 1) { return var1 + (var2-var1)*6*hue; }
      if (2*hue < 1) { return var2; }
      if (3*hue < 2) { return var1 + (var2-var1)*6*(2/3 - hue); }
      return var1;
    };
    return rgb2hex(hue2rgb(h+1/3), hue2rgb(h), hue2rgb(h-1/3));
  }

  return Firepad;
})(this);

// Export Text classes
firepad.Firepad.Formatting = firepad.Formatting;
firepad.Firepad.Text = firepad.Text;
firepad.Firepad.Entity = firepad.Entity;
firepad.Firepad.LineFormatting = firepad.LineFormatting;
firepad.Firepad.Line = firepad.Line;
firepad.Firepad.TextOperation = firepad.TextOperation;

// Export adapters
firepad.Firepad.RichTextCodeMirrorAdapter = firepad.RichTextCodeMirrorAdapter;
firepad.Firepad.ACEAdapter = firepad.ACEAdapter;

return firepad.Firepad; }, this);

},{}]},{},[5,6])