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

    // Reset the objects.
    // TODO: Is this necessary?
    _uriComponents = {};
    _query = {};

    components.scheme = parsedURI[1] || "";
    components.host = parsedURI[2] || "";
    components.path = parsedURI[3] || "";
    components.query = parsedURI[4] || "";
    components.hash = parsedURI[5] || "";
    components.file = ((components.path
                        && components.path.match(/\/([^\/?#]+)$/i)) ||
    [, ''])[1];

    $.extend(_uriComponents, components);
    $.extend(_query, _parseQuery());
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
    if ($.trim(qs))
    {
      var pairs = (qs != "") ? qs.split("&") : [];

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
  this.encodeRelativeURI = function ()
  {
    var encodedRelativeURI;
    var relativeURI = this.getPath();
    var queryString = this.getQueryString();
    var hashString = this.getHash();

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
    var splitItems = this.getPath().split("/");

    if ((splitItems.length > 0) && (splitItems[0] == ""))
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
      throw new Error("There are multiple parameters with the name '" + _key
                      + "'.");
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
    var hashString = (this.getHash() != '') ? '#' + this.getHash() : '';
    var scheme = this.getScheme();

    return (($.trim(scheme) == '') ? "" : (scheme + "://"))
           + this.getHost() + this.getPath()
           + _buildQueryString(this.getQuery(), false)
           + hashString;
  };

  /**
   * Build the string value, and encode the query parameters.
   */
  this.toEncodedString = function ()
  {
    var hashString = (this.getHash() != '') ? '#' + this.getHash() : '';
    var scheme = this.getScheme();

    return (($.trim(scheme) == '') ? "" : (scheme + "://"))
           + this.getHost() + this.getPath()
           + _buildQueryString(this.getQuery(), true) + hashString;
  };

  function _buildQueryString(_query, _encodeValuesFlag)
  {
    var queryString = $.isEmptyObject(_query) ? "" : "?";

    $.each(_query, function (param, values)
    {
      for (var valIndex = 0; valIndex < values.length; valIndex++)
      {
        queryString += param + "=" + ((_encodeValuesFlag === true)
            ? encodeURIComponent(values[valIndex]) : values[valIndex]) + "&";
      }
    });

    if (queryString.charAt(queryString.length - 1) === ("&"))
    {
      queryString = queryString.substr(0, (queryString.length - 1));
    }

    return queryString;
  }

  /**
   * Specific function to obtain the currently requested target of a
   * login/logout within the CADC.  Nobody else will probably use this, but
   * it's here for convenience.
   *
   * @returns {string}
   */
  this.getTargetURL = function ()
  {
    // Get information about the current page
    var requestURL = new currentURI();
    var queryStringObject = requestURL.getQueryStringObject();
    var refererURL = (queryStringObject.referer)
      ? new URI(queryStringObject.referer) : new URI(document.referer);

    var targetURL =
      window.location.protocol + "//" + window.location.hostname
      + (window.location.port ? ":" + window.location.port : "");

    // Some sanitizing.
    if (refererURL.getPath().indexOf("/vosui") >= 0)
    {
      targetURL += "/vosui/";
    }
    else if (refererURL.getPath().indexOf("/canfar")
             >= 0)
    {
      targetURL += "/canfar/";
    }
    else if (refererURL.getPath().indexOf("/en/login")
             >= 0)
    {
      targetURL += "/en/";
    }
    else if (refererURL.getPath().indexOf("/fr/connexion")
             >= 0)
    {
      targetURL += "/fr/";
    }
    else
    {
      targetURL += refererURL.getPath();
    }

    if (requestURL.getHash()
        && (requestURL.getHash() != null)
        && (requestURL.getHash() != ""))
    {
      targetURL += "#" + requestURL.getHash();
    }

    var explicitTarget = requestURL.getQueryValue("target");

    if (explicitTarget)
    {
      targetURL = explicitTarget;
    }

    return targetURL;
  };

  this.clearQuery = function ()
  {
    var q = this.getQuery();
    $.each(q, function (param)
    {
      delete q[param];
    });

    _reparse(this.toString());
  };

  _init();
}

exports._test = {
  "URI": URI,
  "currentURI": currentURI
};
