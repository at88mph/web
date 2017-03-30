'use strict';

(function (window)
{

  /**
   * Obtain the current URI object of the location in context.
   *
   * @return {URI}
   */
  function currentURI()
  {
    return new URI(window.location.href);
  }

  /**
   * URI object.
   *
   * @param _uri     The uri string.
   * @constructor
   */
  function URI(_uri)
  {
    var _URI = _uri;
    var _uriComponents = {};
    var _query = {};

    this.getURI = function ()
    {
      return _URI;
    };


    // This function creates a new anchor element and uses location
    // properties (inherent) to get the desired URL data. Some String
    // operations are used (to normalize results across browsers).
    function _init()
    {
      _reparse(_URI);
    }

    /**
     * Parse the given URI into this object.  This method preserves the uri
     * property in this object as the 'original' uri.
     *
     * @param _uri    The new URI.
     */
    function _reparse(_uri)
    {
      var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
      var parsedURI = _uri.match(parser);
      var components = {};

      components.scheme = parsedURI[1] || '';
      components.host = parsedURI[2] || '';
      components.path = parsedURI[3] || '';
      components.query = parsedURI[4] || '';
      components.hash = parsedURI[5] || '';
      components.file = ((components.path && components.path.match(/\/([^\/?#]+)$/i)) || [, ''])[1];

      _uriComponents = Object.assign(components);
      _query = Object.assign(_parseQuery());
    }

    /**
     * Create an Object from the query string.
     *
     * @returns {Object}
     */
    function _parseQuery()
    {
      var nvpair = {};
      var qs = _uriComponents.query;
      if (qs.trim())
      {
        var pairs = (qs !== '') ? qs.split('&') : [];

        pairs.forEach(function (item)
        {
          var pair = item.split('=');
          var queryKey = pair[0];
          var keyValues = nvpair[queryKey] || [];

          // TODO - Is it a good idea to always decode this?
          // TODO - Should it be?
          keyValues.push(pair[1]);

          nvpair[queryKey] = keyValues;
        });
      }
      return nvpair;
    }

    /**
     * Obtain the relative URI for this URI.  Meaning, obtain the host-less
     * version of this URI, to avoid cross-domain constraint issues.
     *
     * @return  Relative URI, or empty string if none available.
     */
    this.getRelativeURI = function ()
    {
      var relativeURI = this.getPath();
      var queryString = this.getQueryString();
      var hashString = this.getHash();

      if (queryString)
      {
        relativeURI += '?' + queryString;
      }

      if (hashString)
      {
        relativeURI += '#' + hashString;
      }

      return relativeURI;
    };

    /**
     * Encode the relative URI.  This is useful when this URI will be passed
     * as a parameter.
     *
     * Also, since the hash needs to be encoded separately, the logic is well
     * re-used here.
     *
     * @return  {string} Encoded Relative URI.
     */
    this.encodeRelativeURI = function ()
    {
      var encodedRelativeURI;
      var relativeURI = this.getPath();
      var queryString = this.getQueryString();
      var hashString = this.getHash();

      if (queryString)
      {
        relativeURI += '?' + queryString;
      }

      encodedRelativeURI = encodeURI(relativeURI);

      // Treat the has separately.
      if (hashString)
      {
        encodedRelativeURI += encodeURIComponent('#' + hashString);
      }

      return encodedRelativeURI;
    };

    this.getURIComponents = function ()
    {
      return _uriComponents;
    };

    this.getQueryString = function ()
    {
      return _uriComponents.query;
    };

    this.getHash = function ()
    {
      return _uriComponents.hash;
    };

    this.getPath = function ()
    {
      return _uriComponents.path;
    };

    this.getPathItems = function ()
    {
      var splitItems = this.getPath().split('/');

      if ((splitItems.length > 0) && (splitItems[0] === ''))
      {
        // If the path starts with a '/', then the first item will be an empty
        // string, so get rid of it.
        splitItems.splice(0, 1);
      }

      return splitItems;
    };

    this.getFile = function ()
    {
      return _uriComponents.file;
    };

    this.getHost = function ()
    {
      return _uriComponents.host;
    };

    this.getScheme = function ()
    {
      return _uriComponents.scheme;
    };

    /**
     * Key -> value representation of the query string.  Assumes one value per
     * key.
     *
     * @returns {Object}
     * @deprecated  Use getQuery() object instead.
     */
    this.getQueryStringObject = function ()
    {
      return this.getQuery();
    };

    /**
     * Return a key => array values pair.
     *
     * @returns {Object}  Object containing the mapping.
     */
    this.getQuery = function ()
    {
      return _query;
    };

    /**
     * Return a single value for a key.
     *
     * @param _key          The key of the item to look up.
     * @returns {String}    String value, or null.
     */
    this.getQueryValue = function (_key)
    {
      var queryItemArray = this.getQueryValues(_key);
      return (queryItemArray.length > 0) ? queryItemArray[0] : null;
    };

    this.setQueryValue = function (_key, _val)
    {
      var existingValues = this.getQueryValues(_key);

      if (existingValues.length > 1)
      {
        throw new Error('There are multiple parameters with the name "' + _key + '".');
      }
      else
      {
        this.getQuery()[_key] = [_val];
      }
    };

    /**
     * Return an array of values for the given key.
     *
     * @returns {Array}  Array of items, or empty array.
     */
    this.getQueryValues = function (_key)
    {
      var queryItemArray = this.getQuery()[_key];
      return (queryItemArray && (queryItemArray.length > 0))
        ? queryItemArray : [];
    };

    /**
     * Remove ALL of the query parameters for the given key.
     * @param _key    The query parameter name.
     */
    this.removeQueryValues = function (_key)
    {
      delete this.getQuery()[_key];
      _reparse(this.toString());
    };

    /**
     * Build the string
     *
     */
    this.toString = function ()
    {
      var hashString = (this.getHash() !== '') ? '#' + this.getHash() : '';
      var scheme = this.getScheme();

      return ((scheme.trim() === '') ? '' : (scheme + '://'))
        + this.getHost() + this.getPath()
        + _buildQueryString(this.getQuery(), false)
        + hashString;
    };

    /**
     * Build the string value, and encode the query parameters.
     */
    this.toEncodedString = function ()
    {
      var hashString = (this.getHash() !== '') ? '#' + this.getHash() : '';
      var scheme = this.getScheme();

      return ((scheme.trim() === '') ? '' : (scheme + '://'))
        + this.getHost() + this.getPath()
        + _buildQueryString(this.getQuery(), true) + hashString;
    };

    function _buildQueryString(_query, _encodeValuesFlag)
    {
      var queryString = (JSON.stringify(_query) === JSON.stringify({})) ? '' : '?';

      for (var param in _query)
      {
        if (_query.hasOwnProperty(param))
        {
          var values = _query[param];
          for (var valIndex = 0, vl = values.length; valIndex < vl; valIndex++)
          {
            queryString += param + '=' + ((_encodeValuesFlag === true)
                ? encodeURIComponent(values[valIndex]) : values[valIndex]) + '&';
          }
        }
      }

      if (queryString.charAt(queryString.length - 1) === ('&'))
      {
        queryString = queryString.substr(0, (queryString.length - 1));
      }

      return queryString;
    }

    this.clearQuery = function ()
    {
      var q = this.getQuery();
      for (var param in q)
      {
        delete q[param];
      }

      _reparse(this.toString());
    };

    _init();
  }

// Let require() find this.
  module.exports = {
    URI: URI,
    currentURI: currentURI()
  };
})(window);
