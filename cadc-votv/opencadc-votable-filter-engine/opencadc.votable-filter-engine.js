"use strict";

(function ()
{
  function FilterEngine()
  {
    var _FILTER_OPERATOR_CAPTURE_ = /^\s?(>=|<=|=|>|<)?\s?(.*)/;

    this.getFilterOperator = function (_value)
    {
      var matches = _FILTER_OPERATOR_CAPTURE_.exec(_value);
      var match = ((matches !== null) && (matches.length > 1) && matches[1]) ? matches[1].trim() : null;

      return (match === null) ? "" : match;
    }
  }

  /**
   * TODO - There are a lot of return points in this method.  Let's try to reduce them.
   * TODO - jenkinsd 2014.12.04
   *
   * @param {*} filter             The filter value as entered by the user.
   * @param {*} value              The value to be filtered or not
   * @returns {Boolean} true if value is filtered-out by filter.
   */
  FilterEngine.prototype.valueFilters = function (filter, value)
  {
    filter = filter.trim();
    var dotIndex = filter.indexOf("..");

    if (dotIndex > 0)
    {
      // filter on the range and return
      var left = filter.substring(0, dotIndex);
      if ((dotIndex + 2) < filter.length)
      {
        var right = filter.substring(dotIndex + 2);

        if (this.areNumbers(value, left, right))
        {
          return ((parseFloat(value) < parseFloat(left)) || (parseFloat(value) > parseFloat(right)));
        }
        else
        {
          return ((value < left) || (value > right));
        }
      }
    }
    else
    {
      var operator = this.getFilterOperator(filter);
      if (operator)
      {
        filter = filter.substring(operator.length).trim();
      }

      // act on the operator and value
      value = this.areStrings(value) ? value.trim() : value;

      var isFilterNumber = this.isNumber(filter);

      // Special case for those number filter expectations where the data is
      // absent.
      if (isFilterNumber && ((value === "") || (value === "NaN") || (value === Number.NaN)))
      {
        return true;
      }
      else if (operator && !filter)
      {
        return false;
      }
      else if (operator === ">")
      {
        // greater than operator
        if (this.areNumbers(value, filter))
        {
          return parseFloat(value) <= parseFloat(filter);
        }
        else if (this.areStrings(value, filter))
        {
          return value.toUpperCase() <= filter.toUpperCase();
        }
        else
        {
          return value <= filter;
        }
      }
      else if (operator === "<")
      {
        // less-than operator
        if (this.areNumbers(value, filter))
        {
          return parseFloat(value) >= parseFloat(filter);
        }
        else if (this.areStrings(value, filter))
        {
          return value.toUpperCase() >= filter.toUpperCase();
        }
        else
        {
          return (value >= filter);
        }
      }
      else if (operator === ">=")
      {
        // greater-than or equals operator
        if (this.areNumbers(value, filter))
        {
          return parseFloat(value) < parseFloat(filter);
        }
        else if (this.areStrings(value, filter))
        {
          return value.toUpperCase() < filter.toUpperCase();
        }
        else
        {
          return (value < filter);
        }
      }
      else if (operator === "<=")
      {
        // less-than or equals operator
        if (this.areNumbers(value, filter))
        {
          return parseFloat(value) > parseFloat(filter);
        }
        else if (this.areStrings(value, filter))
        {
          return value.toUpperCase() > filter.toUpperCase();
        }
        else
        {
          return (value > filter);
        }
      }
      // Equals "=" is EXACT match.
      else if (operator === "=")
      {
        return (value.toString().toUpperCase() !== filter.toString().toUpperCase());
      }
      else
      {
        if (this.areNumbers(value, filter))
        {
          return (parseFloat(value) !== parseFloat(filter));
        }
        else
        {
          // Any asterisks should be converted to (dot)(asterisk) in regex.
          filter = filter.replace(/\./gi, "\\.");
          filter = filter.replace(/([\w\s]*)\*/gi, "$1.*");

          // Constrain the given filter to start and end where it specified.
          if (filter.indexOf("*") > 0)
          {
            filter = (filter.indexOf("^") < 0) ? ("^" + filter) : filter;
            filter = (filter.indexOf("$") !== (filter.length - 1)) ? (filter + "$") : filter;
          }

          var regex = new RegExp(filter, "gi");

          // If the test is true, then it must be kept, but this method checks
          // for those entries that are to be OMITTED from the results, so check
          // for a false test here.
          return (regex.test(value) === false);
        }
      }
    }
  };

  /**
   * Determine whether the arg val is a number.
   * @param {*} val     The value to check.
   * @return {boolean}
   */
  FilterEngine.prototype.isNumber = function (val)
  {
    return !isNaN(parseFloat(val)) && isFinite(val);
  };

  /**
   * Determine whether the arguments are numbers.
   * @return {boolean}
   */
  FilterEngine.prototype.areNumbers = function ()
  {
    for (var i = 0; i < arguments.length; i++)
    {
      if (!this.isNumber(arguments[i]))
      {
        return false;
      }
    }

    return true;
  };

  /**
   * Determine whether the arguments are strings.
   * @return {boolean}
   */
  FilterEngine.prototype.areStrings = function ()
  {
    for (var i = 0; i < arguments.length; i++)
    {
      if (!(arguments[i].substring))
      {
        return false;
      }
    }
    return true;
  };

  // In case this is imported directly into a page...
  if (typeof module !== "undefined" && module.exports)
  {
    module.exports.FilterEngine = FilterEngine;
  }
})();
