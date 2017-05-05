"use strict";


(function ()
{
  /**
   * URI object.
   *
   * @param {String} _uri     The uri string.
   * @constructor
   */
  function URI(_uri)
  {
    /**
     * @property    Origin URI value.
     * @type {String}
     */
    this.uri = _uri;

    /**
     * @property
     * @type {{}}
     * @private
     */
    this._uriComponents = {};

    /**
     * @property
     * @type {{}}
     * @private
     */
    this._query = {};

    this._init();
  }


  /**
   * This function creates a new anchor element and uses location
   * properties (inherent) to get the desired URL data. Some String
   * operations are used (to normalize results across browsers).
   * @private
   */
  URI.prototype._init = function ()
  {
    this._parse(this.uri);
  };

  /**
   * Parse the given URI into this object.  This method preserves the uri
   * property in this object as the "original" uri.
   *
   * @param _uri    The new URI.
   * @private
   */
  URI.prototype._parse = function (_uri)
  {
    // Regular expressions.
    var FILE_REGEX = /\/([^\/?#]+)$/i;
    var PARSER_REGEX = /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;

    var parsedURI = _uri.match(PARSER_REGEX);
    var components = {};

    components.scheme = parsedURI[1] || "";
    components.host = parsedURI[2] || "";
    components.path = parsedURI[3] || "";
    components.query = parsedURI[4] || "";
    components.hash = parsedURI[5] || "";
    components.file = ((components.path && components.path.match(FILE_REGEX)) || [, ""])[1];

    this._uriComponents = Object.assign({}, components);
    this._query = Object.assign({}, this._parseQuery());
  };

  /**
   * Create an Object from the query string.
   *
   * @returns {Object}
   * @priate
   */
  URI.prototype._parseQuery = function ()
  {
    var keyValuePairs = {};
    var qs = this._uriComponents.query;
    if (qs.trim())
    {
      var pairs = (qs !== "") ? qs.split("&") : [];

      pairs.forEach(function (item)
                    {
                      var pair = item.split("=");
                      var queryKey = pair[0];
                      var keyValues = keyValuePairs[queryKey] || [];

                      // TODO - Is it a good idea to always decode this?
                      // TODO - Should it be?
                      keyValues.push(pair[1]);

                      keyValuePairs[queryKey] = keyValues;
                    });
    }
    return keyValuePairs;
  };

  /**
   * Obtain the relative URI for this URI.  Meaning, obtain the host-less
   * version of this URI, to avoid cross-domain constraint issues.
   *
   * @return  Relative URI, or empty string if none available.
   */
  URI.prototype.getRelativeURI = function ()
  {
    var relativeURI = this._uriComponents.path;
    var queryString = this._uriComponents.query;
    var hashString = this._uriComponents.hash;

    if (queryString)
    {
      relativeURI += "?" + queryString;
    }

    if (hashString)
    {
      relativeURI += "#" + hashString;
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
  URI.prototype.encodeRelativeURI = function ()
  {
    var encodedRelativeURI;
    var relativeURI = this._uriComponents.path;
    var queryString = this._uriComponents.query;
    var hashString = this._uriComponents.hash;

    if (queryString)
    {
      relativeURI += "?" + queryString;
    }

    encodedRelativeURI = encodeURI(relativeURI);

    // Treat the has separately.
    if (hashString)
    {
      encodedRelativeURI += encodeURIComponent("#" + hashString);
    }

    return encodedRelativeURI;
  };

  /**
   * Obtain the path items as an array.
   * @returns {Array}
   */
  URI.prototype.getPathItems = function ()
  {
    var splitItems = this._uriComponents.path.split("/");

    if ((splitItems.length > 0) && (splitItems[0] === ""))
    {
      // If the path starts with a "/", then the first item will be an empty
      // string, so get rid of it.
      splitItems.splice(0, 1);
    }

    return splitItems;
  };

  URI.prototype.getPath = function ()
  {
    return this._uriComponents.path;
  };

  URI.prototype.getScheme = function ()
  {
    return this._uriComponents.scheme;
  };

  URI.prototype.getHash = function ()
  {
    return this._uriComponents.hash;
  };

  URI.prototype.getHost = function ()
  {
    return this._uriComponents.host;
  };

  URI.prototype.getFile = function ()
  {
    return this._uriComponents.file;
  };

  /**
   * Return a key => array values pair.
   *
   * @returns {Object}  Object containing the mapping.
   */
  URI.prototype.getQuery = function ()
  {
    return this._query;
  };

  /**
   * Return a single value for a key.
   *
   * @param _key          The key of the item to look up.
   * @returns {String}    String value, or null.
   */
  URI.prototype.getQueryValue = function (_key)
  {
    var queryItemArray = this.getQueryValues(_key);
    return (queryItemArray.length > 0) ? queryItemArray[0] : null;
  };

  URI.prototype.setQueryValue = function (_key, _val)
  {
    var existingValues = this.getQueryValues(_key);

    if (existingValues.length > 1)
    {
      throw new Error("There are multiple parameters with the name '" + _key + "'.");
    }
    else
    {
      this._query[_key] = [_val];
    }
  };

  /**
   * Return an array of values for the given key.
   *
   * @returns {Array}  Array of items, or empty array.
   */
  URI.prototype.getQueryValues = function (_key)
  {
    var queryItemArray = this._query[_key];
    return (queryItemArray && (queryItemArray.length > 0)) ? queryItemArray : [];
  };

  /**
   * Remove ALL of the query parameters for the given key.
   * @param _key    The query parameter name.
   */
  URI.prototype.removeQueryValues = function (_key)
  {
    delete this._query[_key];
    this._parse(this.toString());
  };

  /**
   * Build the string and return it.
   */
  URI.prototype.toString = function ()
  {
    var hashString = (this._uriComponents.hash !== "") ? "#" + this._uriComponents.hash : "";
    var scheme = this._uriComponents.scheme;

    return ((scheme.trim() === "") ? "" : (scheme + "://"))
           + this._uriComponents.host + this._uriComponents.path
           + this._buildQueryString(this._query, false)
           + hashString;
  };

  /**
   * Build the string value, and encode the query parameters.
   */
  URI.prototype.toEncodedString = function ()
  {
    var hashString = (this._uriComponents.hash !== "") ? "#" + this._uriComponents.hash : "";
    var scheme = this._uriComponents.scheme;

    return ((scheme.trim() === "") ? "" : (scheme + "://"))
           + this._uriComponents.host + this._uriComponents.path
           + this._buildQueryString(this._query, true) + hashString;
  };

  /**
   * Build the query portion of the URL.
   * @param _query
   * @param _encodeValuesFlag
   * @returns {string}
   * @private
   */
  URI.prototype._buildQueryString = function (_query, _encodeValuesFlag)
  {
    var queryString = (JSON.stringify(_query) === JSON.stringify({})) ? "" : "?";

    for (var param in _query)
    {
      if (_query.hasOwnProperty(param))
      {
        var values = _query[param];
        for (var valIndex = 0, vl = values.length; valIndex < vl; valIndex++)
        {
          queryString += param + "=" + ((_encodeValuesFlag === true)
                  ? encodeURIComponent(values[valIndex]) : values[valIndex]) + "&";
        }
      }
    }

    if (queryString.charAt(queryString.length - 1) === ("&"))
    {
      queryString = queryString.substr(0, (queryString.length - 1));
    }

    return queryString;
  };

  /**
   * Clear out the query portion of the URL.
   */
  URI.prototype.clearQuery = function ()
  {
    var q = this._query;
    for (var param in q)
    {
      if (q.hasOwnProperty(param))
      {
        delete q[param];
      }
    }

    this._parse(this.toString());
  };

  if (typeof module !== "undefined" && module.exports)
  {
    module.exports.URI = URI;
  }
})();
