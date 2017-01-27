'use strict';

function Filter()
{
  var _filters = [
    '>', '<', '<=', '>=', '..', '='
  ];

  var filterRegexStartsWith = /^\s?(>=|<=|=|>|<)?\s?(.*)/;

  this.getFilterOperator = function(_value)
  {
    var matches = filterRegexStartsWith.exec(_value);
    var match = ((matches != null) && (matches.length > 1))
      ? $.trim(matches[1]) : null;

    return (match == null) ? '' : match;
  }
}

/**
 * TODO - There are a lot of return points in this method.  Let's try to
 * TODO - reduce them.
 * TODO - jenkinsd 2014.12.04
 *
 * @param filter             The filter value as entered by the user.
 * @param value              The value to be filtered or not
 * @returns {Boolean} true if value is filtered-out by filter.
 */
Filter.prototype.valueFilters = function (filter, value)
{
  filter = $.trim(filter);
  var dotIndex = filter.indexOf('..');

  if (dotIndex > 0)
  {
    // filter on the range and return
    var left = filter.substring(0, dotIndex);
    if ((dotIndex + 2) < filter.length)
    {
      var right = filter.substring(dotIndex + 2);

      if (this.areNumbers(value, left, right))
      {
        return ((parseFloat(value) < parseFloat(left))
                || (parseFloat(value) > parseFloat(right)));
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
      filter = $.trim($.trim(filter).substring(operator.length));
    }

    // act on the operator and value
    value = $.trim(value);

    var isFilterNumber = this.isNumber(filter);

    // Special case for those number filter expectations where the data is
    // absent.
    if (isFilterNumber
        && ((value == '') || (value == 'NaN') || (value == Number.NaN)))
    {
      return true;
    }
    else if (operator && !filter)
    {
      return false;
    }
    else if (operator === '>')
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
    else if (operator === '<')
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
    else if (operator === '>=')
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
    else if (operator === '<=')
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
    // Equals '=' is EXACT match.
    else if (operator === '=')
    {
      return (value.toString().toUpperCase()
              !== filter.toString().toUpperCase());
    }
    else
    {
      if (this.areNumbers(value, filter))
      {
        return (parseFloat(value) != parseFloat(filter));
      }
      else
      {
        // filter = $.ui.autocomplete.escapeRegex(filter);
        filter = (filter.indexOf('^') < 0) ? ('^' + filter) : filter;
        filter = (filter.indexOf('$') !== (filter.length - 1)) ? (filter + '$') : filter;
        filter = filter.replace(/([a-zA-Z0-9\s]*)\*/gi, '$1.*');

        var regex = new RegExp(filter, 'gi');
        var result = regex.test(value);

        return (!result || (result.length == 0));
      }
    }
  }
};

Filter.prototype.isNumber = function (val)
{
  return !isNaN(parseFloat(val)) && isFinite(val);
};

Filter.prototype.areNumbers = function ()
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

Filter.prototype.areStrings = function ()
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

module.exports.Filter = Filter;
