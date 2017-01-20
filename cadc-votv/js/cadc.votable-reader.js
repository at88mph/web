'use strict';

// TODO - Replace with published opencadc-js when available!
var opencadcJS = require('../../cadc-js/js/org.opencadc');
var opencadcVOTable = require('../js/cadc.votable');
var xpath = require('xpath');

var onDataLoadComplete = new jQuery.Event("opencadc-votv:onDataLoadComplete");
var onRowAdd = new jQuery.Event("opencadc-votv:onRowAdd");

// For batch row adding.
var onPageAddStart = new jQuery.Event("opencadc-votv:onPageAddStart");
var onPageAddEnd = new jQuery.Event("opencadc-votv:onPageAddEnd");

/**
 * Object to handle creation of Row objects.
 * @constructor
 */
function RowBuilder()
{
  /**
   * Append a cellID => number for the longest value record of a particular cell
   * to the longestValues object.
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
}

RowBuilder.prototype.subscribe = function(event, eventHandler)
{
  $(this).off(event.type).on(event.type, eventHandler);
};

RowBuilder.prototype.fireEvent = function(event, eventData)
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
    var cellDatatype = cellField.getDatatype();
    var stringValue = extract(rowData, cellIndex);

    this.setLongest(longestValues, cellField.getID(), stringValue);

    var cellValue;

    // Handle the possible array of values. (CADC Story 1750)
    // This is data type agnostic for now.
    if (cellField.containsInterval())
    {
      cellValue = stringValue;
    }
    else if (cellDatatype.isNumeric())
    {
      var num;

      if (!stringValue || ($.trim(stringValue) == ""))
      {
        num = Number.NaN;
      }
      else if (cellDatatype.isFloatingPointNumeric())
      {
        num = parseFloat(stringValue);
        num.toFixed(2);
      }
      else
      {
        num = parseInt(stringValue);
      }
      cellValue = num;
    }
    else if (cellDatatype.isBoolean())
    {
      cellValue = (stringValue === "true");
    }
    else
    {
      // Assume char or char-like value.
      cellValue = stringValue;
    }

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

    /*
    var expressionPath = _preparePath(_expression);
    var xpe = _xmlDOM.ownerDocument || _xmlDOM;

    var localNSResolver = function (prefix)
    {
      var localName = xpe.documentElement.namespaceURI;
      var resolvedName;

      if (localName)
      {
        resolvedName = localName;
      }
      else
      {
        resolvedName = xpe.createNSResolver
          ? xpe.createNSResolver(xpe.documentElement)(prefix)
          : null;
      }

      return resolvedName;
    };

    if (!xpe.evaluate)
    {
      xpe.evaluate = document.evaluate;
    }

    var result = xpe.evaluate(expressionPath, _xmlDOM, localNSResolver,
                              XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    var found = [];
    var res;

    while (res = result.iterateNext())
    {
      found.push(res);
    }

    return found;
    */
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
function VOTableXMLBuilder(input)
{
  RowBuilder.call(this);

  // Still need _self to fire events.
  var _self = this;
  var _voTable = null;
  var _xmlDOM = input.data;
  var _defaultNamespace = input.defaultNamespace;

  function _init()
  {
    if (_xmlDOM.documentElement.nodeName == 'parsererror')
    {
      throw new Error("cadcVOTV: XML input is invalid.\n\n");
    }
  }

  this.getVOTable = function ()
  {
    return _voTable;
  };

  /**
   * Given traverse the DOM for this document to the given expression.
   *
   * @param _xPathExpression   Expression to traverse to.
   * @return {Array}          Array of found items.
   */
  function _getElements(_xPathExpression)
  {
    var evaluator = new XPathEvaluator(_xmlDOM, "votable", _defaultNamespace);
    return evaluator.evaluate(_xPathExpression);
  }

  this.getData = function ()
  {
    return _xmlDOM;
  };

  this.build = function ()
  {
    // Work around the default namespace.
    var xmlVOTableResourceDOMs = _getElements("/VOTABLE/RESOURCE");

    var voTableParameters = [];
    var voTableResources = [];
    var voTableInfos = [];
    var resourceTables = [];
    var resourceInfos = [];
    var voTableFields;

    // Iterate over resources.
    for (var resourceIndex = 0; resourceIndex < xmlVOTableResourceDOMs.length;
         resourceIndex++)
    {
      var nextResourcePath = "/VOTABLE/RESOURCE[" + (resourceIndex + 1) + "]";
      var nextResourceDOM = xmlVOTableResourceDOMs[resourceIndex];
      var resourceInfoDOMs = _getElements(nextResourcePath + "/INFO");

      // Iterate Resource INFOs
      for (var infoIndex = 0; infoIndex < resourceInfoDOMs.length;
           infoIndex++)
      {
        var nextInfo = resourceInfoDOMs[infoIndex];
        resourceInfos.push(
          new opencadcVOTable.Info(nextInfo.getAttribute("name"),
            nextInfo.getAttribute("value")));
      }

      var resourceDescriptionDOMs = _getElements(nextResourcePath
                                                 + "/DESCRIPTION");

      var resourceDescription = resourceDescriptionDOMs.length > 0
        ? resourceDescriptionDOMs[0].value : null;

      var resourceMetadata =
        new opencadcVOTable.Metadata(null, resourceInfos, resourceDescription,
          null, null, null);

      var resourceTableDOMs = _getElements(nextResourcePath + "/TABLE");

      // Iterate over tables.
      for (var tableIndex = 0; tableIndex < resourceTableDOMs.length;
           tableIndex++)
      {
        var nextTablePath = nextResourcePath + "/TABLE[" + (tableIndex + 1)
                            + "]";

        var tableFields = [];
        var resourceTableDescriptionDOM = _getElements(nextTablePath
                                                       + "/DESCRIPTION");
        var resourceTableDescription =
          resourceTableDescriptionDOM.length > 0
            ? resourceTableDescriptionDOM[0].value : null;

        var resourceTableFieldDOM = _getElements(nextTablePath + "/FIELD");

        // To record the longest value for each field (Column).  Will be
        // stored in the TableData instance.
        //
        // It contains a key of the field ID, and the value is the integer
        // length.
        //
        // Born from User Story 1103.
        var longestValues = {};

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
          var nextFieldPath = nextTablePath + "/FIELD[" + (fieldIndex + 1)
                              + "]";
          var fieldDOM = resourceTableFieldDOM[fieldIndex];
          var xmlFieldID = fieldDOM.getAttribute("id");
          var xmlFieldUType = fieldDOM.getAttribute("utype");
          var xmlFieldName = fieldDOM.getAttribute("name");
          var fieldID = (xmlFieldID && (xmlFieldID != ""))
            ? xmlFieldID : xmlFieldName;

          longestValues[fieldID] = -1;

          var fieldDescriptionDOM = _getElements(nextFieldPath
                                                 + "/DESCRIPTION");

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
            new opencadcVOTable.Datatype(fieldDOM.getAttribute("datatype")),
            fieldDOM.getAttribute("arraysize"),
            fieldDescription,
            fieldDOM.getAttribute("name"));

          tableFields.push(field);
        }

        var tableMetadata = new opencadcVOTable.Metadata(null, null,
          resourceTableDescription,
          null, tableFields, null);

        voTableFields =
          (voTableFields === undefined) ? tableFields : voTableFields;

        var tableDataRows = [];
        var rowDataDOMs = _getElements(nextTablePath
                                           + "/DATA/TABLEDATA/TR");
        var tableFieldsMetadata = tableMetadata.getFields();

        for (var rowIndex = 0, rowDataDOMLength = rowDataDOMs.length;
             rowIndex < rowDataDOMLength; rowIndex++)
        {
          var nextRowPath = nextTablePath + "/DATA/TABLEDATA/TR["
                            + (rowIndex + 1) + "]";
          var rowDataDOM = rowDataDOMs[rowIndex];
          var rowCellsDOM = _getElements(nextRowPath + "/TD");
          var rowID = rowDataDOM.getAttribute("id");

          if (!rowID)
          {
            rowID = "vov_" + rowIndex;
          }

          var rowData = this.buildRowData(tableFieldsMetadata, rowID,
                                          rowCellsDOM, longestValues,
                                          getCellData);

          tableDataRows.push(rowData);

          _self.fireEvent(onRowAdd, rowData);
        }

        var tableData = new opencadcVOTable.TableData(tableDataRows,
          longestValues);
        resourceTables.push(new opencadcVOTable.Table(tableMetadata,
          tableData));
      }

      voTableResources.push(
        new opencadcVOTable.Resource(nextResourceDOM.getAttribute("id"),
          nextResourceDOM.getAttribute("name"),
          nextResourceDOM.getAttribute("type") == "meta",
          resourceMetadata, resourceTables));
    }

    var xmlVOTableDescription = _getElements("/VOTABLE/DESCRIPTION");
    var voTableDescription = xmlVOTableDescription.length > 0
      ? xmlVOTableDescription[0].value : null;
    var voTableMetadata = new opencadcVOTable.Metadata(voTableParameters,
      voTableInfos,
      voTableDescription, null,
      voTableFields, null);

    _voTable = new opencadcVOTable.VOTable(voTableMetadata, voTableResources);

    _self.fireEvent(onDataLoadComplete, {voTable: _voTable});
  };

  _init();
}

/**
 * The CSV plugin reader.
 *
 * @param input         The CSV type and table metadata.
 *
 *  input.data = Embedded CSV data.
 *  input.url = {URI} object.
 *  input.pageSize = Size of page of data from URL.
 *  input.tableMetadata = {Metadata} instance.
 *  input.useRelativeURL = Use a relative URI
 *
 * @constructor
 */
function CSVBuilder(input)
{
  RowBuilder.call(this);

  var _self = this;

  if (input.url && input.data)
  {
    throw new Error('Only one of URL or CSV Data is supported, not both.');
  }

  var _longestValues = {};
  var _chunk = {lastMatch: 0, rowCount: 0};
  var _pageSize = input.pageSize || null;

  function init()
  {
    if (_pageSize)
    {
      // Also issue a page end on load complete.
      _self.subscribe(onDataLoadComplete, function ()
      {
        _self.fireEvent(onPageAddEnd);
      });
    }
  }

  /**
   * For non-streaming items.
   */
  this.build = function()
  {
    if (input.data)
    {
      append(input.data);
      loadEnd();
    }
    else if (input.url)
    {
      download(input.useRelativeURL
                 ? input.url.getRelativeURI() : input.url.getURI());
    }
    else
    {
      console.warn('Nothing to do.  Set input.url or input data to build.');
    }
  }

  function append(asChunk)
  {
    var found = findRowEnd(asChunk, _chunk.lastMatch);

    // skip the first row - it contains facsimiles of column names
    if ((_chunk.rowCount === 0) && (found > 0))
    {
      found = advanceToNextRow(asChunk, found);
    }

    while ((found > 0) && (found !== _chunk.lastMatch))
    {
      nextRow(asChunk.slice(_chunk.lastMatch, found));
      found = advanceToNextRow(asChunk, found);
    }
  }

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

  function nextRow(entry)
  {
    var entryAsArray = $.csv.toArray(entry);
    var tableFields = input.tableMetadata.getFields();
    var rowData = _self.buildRowData(tableFields, "vov_" + _chunk.rowCount,
                                    entryAsArray, _longestValues,
                                    function (rowData, index)
                                    {
                                      return rowData[index].trim();
                                    });

    if (_pageSize)
    {
      // Used to calculate the page start and end based on the current row
      // count.
      var moduloPage = (_chunk.rowCount % _pageSize);

      if (moduloPage === 1)
      {
        _self.fireEvent(onPageAddStart);
      }
      else if (moduloPage === 0)
      {
        _self.fireEvent(onPageAddEnd);
      }
    }

    _self.fireEvent(onRowAdd, rowData);
  }

  function loadEnd()
  {
    _self.fireEvent(onDataLoadComplete, {"longestValues": _longestValues});
  }

  function handleProgress(event)
  {
    append(event.target.responseText);
  }

  function download(url)
  {
    $.ajax({
             url: url,
             type: "GET",
             xhr: createRequest
           }).fail(function (jqXHR, textStatus, errorThrown)
                   {
                      throw new Error('Unable to download:\nMessage from server: ('
                                      + jqXHR.status + ') - ' + textStatus
                                      + '\n' + errorThrown);
                   });
  }

  /**
   * Create the internal builder once the request has been established.
   */
  function initialize(event)
  {
    var req = event.target;

    if (req.readyState == req.HEADERS_RECEIVED)
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
    var message =
      "opencadc-votv: Unable to obtain CSV VOTable from URL (" + input.url
      + ").";
    console.log(message);

    throw new Error(message);
  }

  function createRequest()
  {
    var request;

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
                                     handleProgress(_event);
                                     loadEnd();
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
      request.addEventListener("progress", handleProgress, false);
      request.addEventListener("load", loadEnd, false);
      request.addEventListener("abort", loadEnd, false);
      request.addEventListener("readystatechange", initialize, false);
    }

    request.addEventListener("error", loadEnd, false);

    return request;
  }

  init();
}

// 'Sub-classes' of RowBuilder
opencadcJS.inheritPrototype(VOTableXMLBuilder, RowBuilder);
opencadcJS.inheritPrototype(CSVBuilder, RowBuilder);

/**
 * Factory to create an appropriate Builder instance.
 *
 * @constructor
 */
function BuilderFactory()
{
}

/**
 * Our Factory method for creating new Builder instances.
 *
 * @param input
 * @returns {CSVBuilder|*|VOTableXMLBuilder}
 */
BuilderFactory.prototype.createBuilder = function (input)
{

  switch (input.type)
  {
    case 'xml':
    {
      this.builderClass = VOTableXMLBuilder;
      break;
    }

    case 'csv':
    {
      this.builderClass = CSVBuilder;
      break;
    }

    // Defaults to BuilderFactory.prototype.builderClass (VOTableXMLBuilder)
    default:
    {
      this.builderClass = VOTableXMLBuilder;
      break;
    }
  }

  return new this.builderClass(input);
};

// Exposed for testing.
exports._test = {
  RowBuilder: RowBuilder,
  VOTableXMLBuilder: VOTableXMLBuilder,
  CSVBuilder: CSVBuilder,
  XPathEvaluator: XPathEvaluator
};

// exports.RowBuilder = RowBuilder;
// exports.VOTableXMLBuilder = VOTableXMLBuilder;
// exports.CSVBuilder = CSVBuilder;
exports.BuilderFactory = BuilderFactory;
// exports.XPathEvaluator = XPathEvaluator;

// Use the jQuery.Event API as it simplifies things.
exports.events = {
  onDataLoadComplete: onDataLoadComplete,
  onPageAddStart: onPageAddStart,
  onPageAddEnd: onPageAddEnd,
  onRowAdd: onRowAdd
};
