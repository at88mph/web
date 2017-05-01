"use strict";


(function ()
{
  /**
   * Utility object to handle some plan JavaScript repetitive object tasks.
   *
   * Make full use of the prototype object to make new object creation as efficient as possible.
   *
   * @constructor
   */
  function ObjectUtil()
  {
  }

  /**
   * This function succinctly implements the parasitic combination inheritance
   * for us. We pass in the parent object (or Super Class) and the child object
   * (or Sub Class), and the function does the parasitic combination inheritance:
   * makes the child object inherits from the parent object
   *
   * @param childObject     The 'sub class' object.
   * @param parentObject    The 'super class' object.
   */
  ObjectUtil.prototype.inheritPrototype = function (childObject, parentObject)
  {
    // As discussed above, we use the Crockford's method to copy the properties
    // and methods from the parentObject onto the childObject
    // So the copyOfParent object now has everything the parentObject has
    var copyOfParent = Object.create(parentObject.prototype);

    // Then we set the constructor of this new object to point to the childObject.
    // Why do we manually set the copyOfParent constructor here, see the
    // explanation immediately following this code block.
    copyOfParent.constructor = childObject;

    // Then we set the childObject prototype to copyOfParent, so that the
    // childObject can in turn inherit everything from copyOfParent (from
    // parentObject)
    childObject.prototype = copyOfParent;
  };


  /**
   * Basic String utility class.
   *
   * Make full use of the prototype object to make new object creation as efficient as possible.
   *
   * @constructor
   */
  function StringUtil()
  {
  }

  /**
   * Obtain whether the given string has any length (i.e. > 0).
   * @param {String} _str          The string to check.
   * @returns {boolean}
   */
  StringUtil.prototype.hasLength = function (_str)
  {
    return ((_str !== null) && (_str.length > 0));
  };

  /**
   * Obtain whether the given string has any text (i.e. !== "").
   * @param {String|Number|Boolean} _str          The string to check.
   * @returns {boolean}
   */
  StringUtil.prototype.hasText = function (_str)
  {
    var wrapper = String(_str);
    return this.hasLength(wrapper) && (wrapper.trim() !== "");
  };

  /**
   * Format the given string.
   *
   * Given the string:
   *
   * {code}
   * var str = "My name is {1} and I am {2} years old";
   * new StringUtil().format(str, ["George", 39]);
   * {code}
   *
   * would return:
   *
   * My name is George and I am 39 years old
   *
   * Indexes begin at 1, NOT 0.
   *
   * @param {String} _str           The string to check.
   * @param {Array} _values         The values to replace.
   * @returns {string}
   */
  StringUtil.prototype.format = function (_str, _values)
  {
    var vl = _values.length;

    // Create new string to not modify the original.
    return _str.replace(/{(\d+)}/g, function (match, number)
    {
      var index = (number - 1);
      var next = vl > index ? _values[index] : null;

      return (next === null) ? match : next;
    });
  };

  /**
   * Sanitize the given string for HTML.
   *
   * @param {String} _str        String to sanitize.
   * @returns {string}
   */
  StringUtil.prototype.sanitize = function (_str)
  {
    return _str ? _str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
  };

  /**
   * Obtain whether the given regex matches the given string.
   *
   * @param {String} _regex        The regex to execute.
   * @param {String} _str          The string to execute against.
   * @returns {boolean}
   */
  StringUtil.prototype.matches = function (_regex, _str)
  {
    return new RegExp(_regex).test(_str);
  };

  /**
   * Obtain whether the _string contains the given _str.
   *
   * @param {String} _string         The String to check.
   * @param {String} _match          The string to see if is contained.
   * @param {Boolean} _matchCase     Optionally match case.
   * @returns {boolean}
   */
  StringUtil.prototype.contains = function (_string, _match, _matchCase)
  {
    var expression = ".*" + _match + ".*";
    var regExp = (_matchCase === true) ? new RegExp(expression) : new RegExp(expression, "gi");

    return regExp.test(_string);
  };

  /**
   * Check if _str ends with the _subStr value.
   *
   * @param _str          The string to check.
   * @param _subStr       The string to look for in _str.
   * @returns {boolean}   True if it exists, false otherwise.
   */
  StringUtil.prototype.endsWith = function (_str, _subStr)
  {
    return (_str.indexOf(_subStr) === (_str.length - _subStr.length));
  };


  /**
   * Utility class to check for proper true or false values when being set in a configuration property.
   *
   * More specifically, this will check for the presence of a setting, rather than whether the given value is simply
   * false or true.
   *
   * @constructor
   */
  function BooleanUtil()
  {
  }

  /**
   * Return whether the given value is true, or "positive".  This will test for
   * things like "true", true, 1, "yes", "y".
   *
   * @param {*} _val
   * @return {boolean}
   */
  BooleanUtil.prototype.isTrueValue = function (_val)
  {
    var _TRUTH_REGEX_ = /^\s*true|1|y(es)?\s*$/i;
    return (_val === true) || _TRUTH_REGEX_.test(_val + "");
  };

  /**
   * Return whether the given value is false, or "negative".  This will test for
   * things like "false", false, 0, "no", "n".
   *
   * @param {*} _val
   */
  BooleanUtil.prototype.isFalseValue = function (_val)
  {
    var _FALSE_REGEX_ = /^\s*false|0|n(o)?\s*$/i;
    return (_val === false) || _FALSE_REGEX_.test(_val + "");
  };


  /**
   * Format numeric values for output.
   *
   * @constructor
   */
  function NumberFormat()
  {
  }

  /**
   * Format to fixation, meaning the number of integers after the decimal
   * place.
   *
   * @param _val        The value to format.
   * @param _sigDig     number of significant digits.
   * @returns {string}
   */
  NumberFormat.prototype.formatFixation = function (_val, _sigDig)
  {
    return _val.toFixed(_sigDig);
  };

  /**
   * Format to precision, meaning the number of characters all together.
   *
   * @param _val        The value to format.
   * @param _sigDig     number of significant digits.
   * @returns {string}
   */
  NumberFormat.prototype.formatPrecision = function (_val, _sigDig)
  {
    return _val.toPrecision(_sigDig);
  };

  /**
   * An attempt to reproduce the printf(%.g) format.
   *
   * From the sprintf man page:
   *
   * "Style e is used if the exponent from its conversion is less than -4 or
   *  greater than or equal to the precision.  Trailing zeros are removed from
   *  the fractional part of the result; a decimal point appears only if it
   *  is followed by at least one digit."
   *
   * jenkinsd 2013.12.20
   *
   * @returns {string}
   */
  NumberFormat.prototype.formatExponentOrFloat = function (_val, _sigDig)
  {
    var exponentialVal = _val.toExponential(_sigDig);
    var exponent = _val.toExponential().split("+")[1];

    return ((exponent < -4) || (exponent >= _sigDig)) ? exponentialVal : this.formatFixation(_val, _sigDig);
  };

  /**
   * Default format function.
   *
   * @return {string}
   */
  NumberFormat.prototype.format = function (_val, _sigDig)
  {
    return (_sigDig) ? this.formatFixation(_val, _sigDig) : _val.toString();
  };


  /**
   * Function to emulate the compare() method for various datatypes.
   * @constructor
   */
  function Comparer()
  {
  }

  /**
   * Inner sort method.  This will determine data types and do appropriate
   * comparisons.
   *
   * @param _left {*}     Anything under the sun.
   * @param _right {*}    Anything under the other sun.
   * @returns {number}    The Score of the sort comparison.
   */
  Comparer.prototype.compare = function (_left, _right)
  {
    var leftCompare, rightCompare;

    if ((typeof _left === "string") && ((typeof _right === "string")))
    {
      leftCompare = _left.toLowerCase();
      rightCompare = _right.toLowerCase();
    }
    else if (((typeof _left === "object") && ((typeof _right === "object")))
             || ((typeof _left === "function") && ((typeof _right === "function"))))
    {
      leftCompare = _left.toString();
      rightCompare = _right.toString();
    }
    else
    {
      leftCompare = _left;
      rightCompare = _right;
    }

    return (leftCompare > rightCompare) ? 1 : (leftCompare < rightCompare) ? -1 : 0;
  };

  /**
   * Utility to handle Array operations.
   *
   * @param {*}   [_comparer={Comparer}]     A comparer to compare array items.  Optional.
   * @constructor
   */
  function ArrayUtil(_comparer)
  {
    // Private comparer
    this._innerComparer = _comparer || new Comparer();
  }

  /**
   * Subtract the contents of _array from ths array.  This is not a diff,
   * just an overlap find and remove operation.
   *
   * @param _sourceArray    The array to modify
   *
   * @param _operation    {Array | function}
   *  The Array to remove OR
   *  The function to filter out items.  This is useful for arrays of objects
   *  whose equality is no concise.  (function (element, index, array) {})
   */
  ArrayUtil.prototype.subtract = function (_sourceArray, _operation)
  {
    if (!_sourceArray || !_operation)
    {
      throw new Error("Subtract requires an array or a filter function.");
    }
    else
    {
      if (typeof _operation === "function")
      {
        return this._subtractFilterHandler(_sourceArray, _operation);
      }
      else
      {
        return this._subtractArray(_sourceArray, _operation)
      }
    }
  };

  /**
   * Handler to perform the filter functions for an array.
   *
   * @template T
   * @param {Array}     _sourceArray  The Array to filter from.
   * @param {function(T=, number=, Array.<T>=)}  _filterHandler  Handler to calculate filter.
   * @return {Array.<T>}
   * @private
   */
  ArrayUtil.prototype._subtractFilterHandler = function (_sourceArray, _filterHandler)
  {
    if (!_filterHandler)
    {
      throw new Error("Filter handler is required.");
    }
    else
    {
      return _sourceArray.filter(_filterHandler);
    }
  };

  /**
   * Subtract an array from another one.
   *
   * @param {Array} _sourceArray    The array to subtract from.
   * @param {Array} _array          The array to subtract.
   * @return {Array}  The new array.
   * @private
   */
  ArrayUtil.prototype._subtractArray = function (_sourceArray, _array)
  {
    if (!_array)
    {
      throw new Error("Array being subtracted is required.");
    }
    else
    {
      return this._subtractFilterHandler(_sourceArray, function (item)
      {
        return (_array.indexOf(item) < 0);
      });
    }
  };

  /**
   * Sort this Array in _ascendingFlag ? order.  This will clone the base
   * array and return it sorted.  The base array remains unaffected.
   *
   * @param {Array} _sourceArray    The array to sort.
   * @param {*} _propertyName  The name of the property to search on, if this
   *                       is an array of objects.  It is null otherwise.
   *                       Optional.
   * @returns {Blob|ArrayBuffer|Array|string|*}
   */
  ArrayUtil.prototype.sort = function (_sourceArray, _propertyName)
  {
    var cloneArray = _sourceArray.slice(0);

    cloneArray.sort(function (o1, o2)
                    {
                      var score;

                      if (_propertyName)
                      {
                        if (o1.hasOwnProperty(_propertyName) && o2.hasOwnProperty(_propertyName))
                        {
                          score = this._innerComparer.compare(o1[_propertyName], o2[_propertyName]);
                        }
                        else
                        {
                          throw new Error("Property '" + _propertyName
                                          + "' does not exist in the objects being compared.")
                        }
                      }
                      else
                      {
                        score = this._innerComparer.compare(o1, o2);
                      }

                      return score;
                    }.bind(this));

    return cloneArray;
  };

  /**
   * GUID generator.
   *
   * @constructor
   */
  function GUID()
  {
  }

  GUID.prototype._s4 = function ()
  {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };

  GUID.prototype.generate = function ()
  {
    return this._s4() + this._s4() + "-" + this._s4() + "-" + this._s4() + "-" + this._s4() + "-" + this._s4()
           + this._s4() + this._s4();
  };

  // Make findable.
  if (module && module.exports)
  {
    module.exports = {
      ObjectUtil: ObjectUtil,
      StringUtil: StringUtil,
      BooleanUtil: BooleanUtil,
      ArrayUtil: ArrayUtil,
      NumberFormat: NumberFormat,
      GUID: GUID,
      Comparer: Comparer
    };
  }

})();
