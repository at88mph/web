'use strict';

var opencadcJS = require('opencadc-js').util;

/**
 * During a sort, this is the comparer that is used.  This CompareEngine is used by the DataView object in the
 * opencadc-votable-viewer, so it expects the comparison items to be pulled from the datacontext (a{}, b{}).
 */
(function (opencadcJS)
{
  /**
   * Compare values.  Used in sorting operations.
   *
   * -1 : if x < y
   *  0 : if x = y
   *  1 : if x > y
   *
   *  Nan < 0
   */
  function AbstractCompareEngine(__sortKey)
  {
    var sortKey = __sortKey || null;

    // Backward compatibility.
    this.setSortColumn = this.setSortKey;

    this.setSortKey = function (_sortKey)
    {
      sortKey = _sortKey;
    };

    this.getValue = function(_columnObject)
    {
      if (!_columnObject)
      {
        throw new Error('Column object is empty.');
      }
      else
      {
        return _columnObject[sortKey]
      }
    };
  }

  /**
   * Comparison engine for values that are not numeric, which usually means strings.
   *
   * @constructor
   */
  function DefaultCompareEngine()
  {
    AbstractCompareEngine.call(this);

    /**
     * @param compareThis   Left object containing a valued assigned to the sortKey.
     * @param toThis        Right object containing a valued assigned to the sortKey.
     * @returns {number}    1 means compareThis is greater than toThis, 0 means equality, and -1 means compareThis
     * is less than toThis.
     */
    this.compare = function(compareThis, toThis)
    {
      var left = this.getValue(compareThis);
      var right = this.getValue(toThis);
      return (left == right ? 0 : (left > right ? 1 : -1));
    }
  }

  /**
   * For comparing known numeric (declared) column values.
   */
  function NumericCompareEngine()
  {
    AbstractCompareEngine.call(this);

    /**
     * Comparison of values that may contain 'empty strings'.  Empty strings, as numbers, are Number.NaN.
     *
     * @param compareThis   Left object containing a valued assigned to the sortKey.
     * @param toThis        Right object containing a valued assigned to the sortKey.
     * @returns {number}    1 means compareThis is greater than toThis, 0 means equality, and -1 means compareThis
     * is less than toThis.
     */
    this.compare = function (compareThis, toThis)
    {
      var left = this.getValue(compareThis);
      var right = this.getValue(toThis);

      var xNan = isNaN(left);
      var yNan = isNaN(right);
      var xZero = (left === 0.0);
      var yZero = (right === 0.0);

      var compareResult;

      // NaN < 0
      if (xNan && yZero)
      {
        compareResult = -1;
      }
      else if (xZero && yNan)
      {
        compareResult = 1;
      }
      else if (xNan && yNan)
      {
        compareResult = 0;
      }
      else if (!xNan && yNan)
      {
        compareResult = 1;
      }
      else if (xNan && !yNan)
      {
        compareResult = -1;
      }
      else
      {
        // The odd case when a numeric column has mixed numbers and strings, for whatever reason, and two of those
        // strings are being compared.
        //
        compareResult = new DefaultCompareEngine().compare(left, right);
      }

      return compareResult;
    }
  }

  opencadcJS.inheritPrototype(DefaultCompareEngine, AbstractCompareEngine);
  opencadcJS.inheritPrototype(NumericCompareEngine, AbstractCompareEngine);

  module.exports =
    {
      'NumericCompareEngine': NumericCompareEngine,
      'DefaultCompareEngine': DefaultCompareEngine
    };

})(opencadcJS);
