"use strict";

(function ($, xpath, opencadcUtil, opencadcVOTable, undefined)
{
  var readerEvents = {
    onDataLoadComplete: new $.Event("opencadc-votv:onDataLoadComplete"),
    onRowAdd: new $.Event("opencadc-votv:onRowAdd"),

    // For batch row adding.
    onPageAddStart: new $.Event("opencadc-votv:onPageAddStart"),
    onPageAddEnd: new $.Event("opencadc-votv:onPageAddEnd")
  };

  var _DEFAULT_PAGE_SIZE_ = 50;

  /**
   * Object to handle creation of Row objects.
   * @constructor
   */
  function RowBuilder()
  {
    /**
     * Append a cellID => number for the longest value record of a particular
     * cell to the longestValues object.
     *
     * @param {Object} longestValues
     * @param cellID
     * @param newValue
     */
    this.setLongest = function (longestValues, cellID, newValue)
    {
      var stringLength = (newValue && newValue.length) ? newValue.length : -1;

      if (longestValues[cellID] === undefined)
      {
        longestValues[cellID] = -1;
      }
      if (stringLength > longestValues[cellID])
      {
        longestValues[cellID] = stringLength;
      }
    };

    this.handleRowAddEvents = function (rowData, rowCount, pageSize)
    {
      // Used to calculate the page start and end based on the current row
      // count.
      var moduloPage = (rowCount % pageSize);

      if (moduloPage === 1)
      {
        this.fireEvent(readerEvents.onPageAddStart);
      }
      else if (moduloPage === 0)
      {
        this.fireEvent(readerEvents.onPageAddEnd);
      }

      this.fireEvent(readerEvents.onRowAdd, {"rowData": rowData});
    };
  }

  RowBuilder.prototype.subscribe = function (event, eventHandler)
  {
    $(this).off(event.type).on(event.type, eventHandler);
  };

  RowBuilder.prototype.fireEvent = function (event, eventData)
  {
    $(this).trigger(event, eventData);
  };

  /**
   * Create one row of data.
   *
   * @param tableFields
   * @param rowID
   * @param rowData
   * @param longestValues
   * @param extract
   * @returns {*|Row}
   */
  RowBuilder.prototype.buildRowData = function (tableFields, rowID, rowData,
                                                longestValues, extract)
  {
    var rowCells = [];
    for (var cellIndex = 0, rowDataLength = rowData.length,
             tableFieldLength = tableFields.length;
         (cellIndex < rowDataLength) && (cellIndex < tableFieldLength);
         cellIndex++)
    {
      var cellField = tableFields[cellIndex];
      var cellDatatype = cellField.getDataType();
      var stringValue = extract(rowData, cellIndex);

      this.setLongest(longestValues, cellField.getID(), stringValue);

      // Handle the possible array of values. (CADC Story 1750)
      // This is data type agnostic for now.
      var cellValue = (cellField.containsInterval()) ? stringValue : cellDatatype.sanitize(stringValue);

      rowCells.push(new opencadcVOTable.Cell(cellValue, cellField));
    }

    return new opencadcVOTable.Row(rowID, rowCells);
  };

  /**
   * Evaluate XPath cross-browser.
   *
   * @param __xmlDOM                   The document to traverse.
   * @param __defaultNamespacePrefix   The prefix for default namespaces.
   * @param __defaultNamespace         The default namespace expected.
   * @constructor
   */
  function XPathEvaluator(__xmlDOM, __defaultNamespacePrefix, __defaultNamespace)
  {
    var _xmlDOM = __xmlDOM;
    var _defaultNamespacePrefix = __defaultNamespacePrefix;
    var _defaultNamespace = __defaultNamespace;

    /**
     * Prepare the given expression to be processed.  This method will simply
     * prepend the default namespace where needed.
     *
     * @param _expression   The expression XPath to prepare.
     * @return {String}     The prepared path.
     */
    function _preparePath(_expression)
    {
      var pathItems = _expression ? _expression.split("/") : [];
      var path = "";

      for (var piIndex = 0; piIndex < pathItems.length; piIndex++)
      {
        var nextItem = pathItems[piIndex];

        if (nextItem)
        {
          path += "/" + _defaultNamespacePrefix + ":" + nextItem;
        }
      }

      return path;
    }

    /**
     * Evaluate an XPath expression this reader's DOM, returning the results as
     * an array thanks wanderingstan at morethanwarm dot mail dot com for the
     * initial work.
     *
     * @param _expression   The expression XPath to look for from the root.
     * @return {Array}
     */
    this.evaluate = function (_expression)
    {
      var expressionPath = _preparePath(_expression);
      var namespaces = {};
      namespaces[_defaultNamespacePrefix] = _defaultNamespace;

      var select = xpath.useNamespaces(namespaces);
      return select(expressionPath, _xmlDOM);
    }
  }

  /**
   * The XML plugin reader.
   *
   * @param input               The encompassing input object.
   *    input.data              The XML DOM to use.
   *    input.defaultNamespace  The default namespace.
   * @constructor
   */
  function VOTableXMLRowBuilder(input)
  {
    RowBuilder.call(this);

    var _xmlDOM = input.data;
    var _defaultNamespace = input.defaultNamespace;

    /**
     * Error checking on initialization.
     *
     * @private
     */
    this._init = function ()
    {
      if (_xmlDOM.documentElement.nodeName === "parsererror")
      {
        throw new Error("cadcVOTV: XML input is invalid.\n\n");
      }
    };

    /**
     * Given traverse the DOM for this document to the given expression.
     *
     * @param _xPathExpression   Expression to traverse to.
     * @return {Array}          Array of found items.
     * @private
     */
    this._getElements = function(_xPathExpression)
    {
      var evaluator = new XPathEvaluator(_xmlDOM, "votable", _defaultNamespace);
      return evaluator.evaluate(_xPathExpression);
    };

    this.build = function ()
    {
      // Work around the default namespace.
      var xmlVOTableResourceDOMs = this._getElements("/VOTABLE/RESOURCE[@type=\"results\"]");
      var dataTypeFactory = new opencadcVOTable.DataTypeFactory();

      var voTableInfos = [];
      var resourceInfos = [];
      var voTableFields = [];

      // To record the longest value for each field (Column).  Will be
      // stored in the TableData instance.
      //
      // It contains a key of the field ID, and the value is the integer
      // length.
      //
      // Born from User Story 1103.
      var longestValues = {};

      // Read the results Resource.
      if (xmlVOTableResourceDOMs.length > 0)
      {
        var nextResourcePath = "/VOTABLE/RESOURCE[1]";
        var resourceInfoDOMs = this._getElements(nextResourcePath + "/INFO");

        // Iterate Resource INFOs
        for (var infoIndex = 0; infoIndex < resourceInfoDOMs.length;
             infoIndex++)
        {
          var nextInfo = resourceInfoDOMs[infoIndex];
          resourceInfos.push(
              new opencadcVOTable.Info(nextInfo.getAttribute("name"),
                                       nextInfo.getAttribute("value")));
        }

        var resourceTableDOMs = this._getElements(nextResourcePath + "/TABLE");

        // Iterate over tables.
        for (var tableIndex = 0; tableIndex < resourceTableDOMs.length;
             tableIndex++)
        {
          var nextTablePath = nextResourcePath + "/TABLE[" + (tableIndex + 1) + "]";

          var tableFields = [];
          var resourceTableFieldDOM = this._getElements(nextTablePath + "/FIELD");

          /**
           * Method to construct a row.  This is called for each row read.
           *
           * @param rowData       The row data for a single row.
           * @param index         The row index.
           * @returns {string|*}
           */
          var getCellData = function (rowData, index)
          {
            var cellDataDOM = rowData[index];
            return (cellDataDOM.childNodes && cellDataDOM.childNodes[0]) ?
                cellDataDOM.childNodes[0].nodeValue : "";
          };

          for (var fieldIndex = 0; fieldIndex < resourceTableFieldDOM.length;
               fieldIndex++)
          {
            var nextFieldPath = nextTablePath + "/FIELD[" + (fieldIndex + 1) + "]";
            var fieldDOM = resourceTableFieldDOM[fieldIndex];
            var xmlFieldID = fieldDOM.getAttribute("id");
            var xmlFieldUType = fieldDOM.getAttribute("utype");
            var xmlFieldName = fieldDOM.getAttribute("name");
            var fieldID = (xmlFieldID && (xmlFieldID !== ""))
                ? xmlFieldID : xmlFieldName;

            longestValues[fieldID] = -1;

            var fieldDescriptionDOM = this._getElements(nextFieldPath + "/DESCRIPTION");

            var fieldDescription = ((fieldDescriptionDOM.length > 0)
                                    && fieldDescriptionDOM[0].childNodes
                                    && fieldDescriptionDOM[0].childNodes[0])
                ? fieldDescriptionDOM[0].childNodes[0].nodeValue
                : "";

            var field = new opencadcVOTable.Field(
                xmlFieldName,
                fieldID,
                fieldDOM.getAttribute("ucd"),
                xmlFieldUType,
                fieldDOM.getAttribute("unit"),
                fieldDOM.getAttribute("xtype"),
                dataTypeFactory.createDataType(fieldDOM.getAttribute("datatype")),
                fieldDOM.getAttribute("arraysize"),
                fieldDescription,
                fieldDOM.getAttribute("name"));

            tableFields.push(field);
            voTableFields.push(field);
          }

          // var tableDataRows = [];
          var rowDataDOMs = this._getElements(nextTablePath + "/DATA/TABLEDATA/TR");
          var rowCount = 0;

          for (var rowIndex = 0, rowDataDOMLength = rowDataDOMs.length;
               rowIndex < rowDataDOMLength; rowIndex++)
          {
            var nextRowPath = nextTablePath + "/DATA/TABLEDATA/TR[" + (rowIndex + 1) + "]";
            var rowDataDOM = rowDataDOMs[rowIndex];
            var rowCellsDOM = this._getElements(nextRowPath + "/TD");
            var rowID = rowDataDOM.getAttribute("id");

            if (!rowID)
            {
              rowID = "vov_" + rowIndex;
            }

            var rowData = this.buildRowData(tableFields, rowID, rowCellsDOM,
                                            longestValues, getCellData);

            rowCount++;

            this.handleRowAddEvents(rowData, rowCount, _DEFAULT_PAGE_SIZE_);
          }
        }
      }

      var xmlVOTableDescription = this._getElements("/VOTABLE/DESCRIPTION");
      var voTableDescription = (xmlVOTableDescription.length > 0)
          ? xmlVOTableDescription[0].value : null;
      var voTableMetadata = new opencadcVOTable.Metadata(
          voTableInfos, voTableDescription, voTableFields);

      this.fireEvent(readerEvents.onDataLoadComplete, {
        tableMetaData: voTableMetadata,
        longestValues: longestValues
      });
    };
  }

  /**
   * The CSV plugin reader.
   *
   * @param input         The CSV type and table metadata.
   * @param input.data = Embedded CSV data.
   * @param input.url = {URI} object.
   * @param input.pageSize = Size of page of data from URL.
   * @param input.tableMetadata = {Metadata} instance.
   * @param input.useRelativeURL = Use a relative URI
   *
   * @constructor
   */
  function CSVRowBuilder(input)
  {
    RowBuilder.call(this);

    if (input.url && input.data)
    {
      throw new Error("Only one of URL or CSV Data is supported, not both.");
    }

    var _longestValues = {};
    var _chunk = {lastMatch: 0, rowCount: 0};
    var _pageSize = input.pageSize || _DEFAULT_PAGE_SIZE_;

    this.init = function ()
    {
      if (_pageSize)
      {
        // Also issue a page end on load complete.
        this.subscribe(readerEvents.onDataLoadComplete, function ()
        {
          this.fireEvent(readerEvents.onPageAddEnd);
        });
      }
    };

    /**
     * For streaming and non-streaming CSV data.
     */
    this.build = function ()
    {
      if (input.data)
      {
        this.append(input.data);
        this.loadEnd();
      }
      else if (input.url)
      {
        this.download(input.useRelativeURL
                          ? input.url.getRelativeURI() : input.url.getURI());
      }
      else
      {
        console.warn("Nothing to do.  Set input.url or input data to build.");
      }
    };

    this.append = function (asChunk)
    {
      var found = findRowEnd(asChunk, _chunk.lastMatch);

      // skip the first row - it contains facsimiles of column names
      if ((_chunk.rowCount === 0) && (found > 0))
      {
        found = advanceToNextRow(asChunk, found);
      }

      while ((found > 0) && (found !== _chunk.lastMatch))
      {
        this.nextRow(asChunk.slice(_chunk.lastMatch, found));
        found = advanceToNextRow(asChunk, found);
      }
    };

    function advanceToNextRow(asChunk, lastFound)
    {
      _chunk.rowCount++;
      _chunk.lastMatch = lastFound;
      return findRowEnd(asChunk, _chunk.lastMatch);
    }

    function findRowEnd(inChunk, lastFound)
    {
      return inChunk.indexOf("\n", lastFound + 1);
    }

    this.nextRow = function (entry)
    {
      var entryAsArray = $.csv.toArray(entry);
      var tableFields = input.tableMetadata.getFields();
      var rowData = this.buildRowData(tableFields, "vov_" + _chunk.rowCount,
                                      entryAsArray, _longestValues,
                                      function (rowData, index)
                                      {
                                        return rowData[index].trim();
                                      });

      this.handleRowAddEvents(rowData, _chunk.rowCount, _pageSize);
    };

    this.loadEnd = function ()
    {
      this.fireEvent(readerEvents.onDataLoadComplete,
                     {"longestValues": _longestValues});
    };

    this.handleProgress = function (event)
    {
      this.append(event.target.responseText);
    };

    this.download = function (url)
    {
      $.ajax({
               url: url,
               type: "GET",
               xhr: this._createRequest
             }).fail(function (jqXHR, textStatus, errorThrown)
                     {
                       throw new Error("Unable to download:\nMessage from server: ("
                                       + jqXHR.status + ") - " + textStatus
                                       + "\n" + errorThrown);
                     });
    };

    /**
     * Create the internal builder once the request has been established.
     */
    function initialize(event)
    {
      var req = event.target;

      if (req.readyState === req.HEADERS_RECEIVED)
      {
        var contentType = req.getResponseHeader("Content-Type");

        // Only CSV supports streaming!
        if (!contentType && !((contentType.indexOf("csv") >= 0)
                              || (contentType.indexOf("text/plain") >= 0)))
        {
          handleInputError();
        }
      }
    }

    function handleInputError()
    {
      var message = "opencadc-votv: Unable to obtain CSV VOTable from URL (" + input.url + ").";
      console.log(message);

      throw new Error(message);
    }

    this._createRequest = function ()
    {
      var request;
      var _builder = this;

      try
      {
        // This won't work in versions 5 & 6 of Internet Explorer.
        request = new XMLHttpRequest();
      }
      catch (trymicrosoft)
      {
        console.log("Trying Msxml2 request.");
        try
        {
          request = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (othermicrosoft)
        {
          try
          {
            console.log("Trying Microsoft request.");
            request = new ActiveXObject("Microsoft.XMLHTTP");
          }
          catch (failed)
          {
            throw new Error("Unable to create an HTTP request.  Aborting!");
          }
        }
      }

      // Internet Explorer will need to be handled via the old state change
      // behaviour.
      if (window.ActiveXObject)
      {
        request.addEventListener("readystatechange",
                                 function (_event)
                                 {
                                   try
                                   {
                                     initialize(_event);

                                     // Complete
                                     if (this.readyState === this.DONE)
                                     {
                                       _builder.handleProgress(_event);
                                       _builder.loadEnd();
                                     }
                                   }
                                   catch (e)
                                   {
                                     console.log(e);
                                     handleInputError();
                                   }
                                 },
                                 false);
      }
      else
      {
        request.addEventListener("progress", _builder.handleProgress, false);
        request.addEventListener("load", _builder.loadEnd, false);
        request.addEventListener("abort", _builder.loadEnd, false);
        request.addEventListener("readystatechange", initialize, false);
      }

      request.addEventListener("error", _builder.loadEnd, false);

      return request;
    };

    this.init();
  }

  // 'Sub-classes' of RowBuilder
  var objectUtil = new opencadcUtil.ObjectUtil();
  objectUtil.inheritPrototype(VOTableXMLRowBuilder, RowBuilder);
  objectUtil.inheritPrototype(CSVRowBuilder, RowBuilder);

  /**
   * Factory to create an appropriate Builder instance.
   *
   * @constructor
   */
  function RowBuilderFactory()
  {
  }

  /**
   * Our Factory method for creating new Builder instances.
   *
   * @param input
   * @returns {CSVRowBuilder|*|VOTableXMLRowBuilder}
   */
  RowBuilderFactory.prototype.createBuilder = function (input)
  {
    switch (input.type)
    {
      case "xml":
      {
        this.builderClass = VOTableXMLRowBuilder;
        break;
      }

      case "csv":
      {
        this.builderClass = CSVRowBuilder;
        break;
      }

      // Defaults to RowBuilderFactory.prototype.builderClass (VOTableXMLBuilder)
      default:
      {
        this.builderClass = VOTableXMLRowBuilder;
        break;
      }
    }

    return new this.builderClass(input);
  };

  module.exports = {
    RowBuilderFactory: RowBuilderFactory,
    XPathEvaluator: XPathEvaluator,
    events: readerEvents
  };

})(jQuery, xpath, opencadcUtil, opencadcVOTable);
