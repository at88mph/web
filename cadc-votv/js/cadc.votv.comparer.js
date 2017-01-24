'use strict';


/**
 * Compare values.
 *
 * -1 : if x < y
 *  0 : if x = y
 *  1 : if x > y
 *
 *  Nan < 0
 */
function Comparer(__sortColumn, __isNumeric)
{
  var _sortColumn = __sortColumn || null;
  var _comparer = __isNumeric ? nanCompare : contentCompare;

  /**
   * For values of the same type, with content.
   *
   * @param compareThis
   * @param toThis
   * @returns {number}
   */
  function contentCompare(compareThis, toThis)
  {
    return (compareThis == toThis ? 0 : (compareThis > toThis ? 1 : -1));
  }

  /**
   * Comparison of values that may contain 'empty strings'.  Empty strings,
   * as numbers, are Number.NaN.
   *
   * @param x
   * @param y
   * @returns {*}
   */
  function nanCompare(x, y)
  {
    var xNan = isNaN(x);
    var yNan = isNaN(y);
    var xZero = (x === 0.0);
    var yZero = (y === 0.0);

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
      compareResult = contentCompare(x, y);
    }

    return compareResult;
  }

  /**
   * During a sort, this is the comparer that is used.  This comparer is used
   * by the DataView object, so it expects the comparison items to be pulled
   * from the datacontext (a{}, b{}).
   */
  this.compare = function(_x, _y)
  {
    return _comparer(_x[_sortColumn], _y[_sortColumn]);
  };

  this.setIsNumeric = function(_isNumericFlag)
  {
    _comparer = _isNumericFlag ? nanCompare : contentCompare;
  };

  this.setSortColumn = function(_sortCol)
  {
    _sortColumn = _sortCol;
  };
}

exports.Comparer = Comparer;
