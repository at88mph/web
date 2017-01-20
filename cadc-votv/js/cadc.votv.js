'use strict';

var $ = require('jquery');
var opencadcVOTableReader = require('../js/cadc.votable-reader');

/**
 * Create a VOView object.  This is here to package everything together.
 *
 * @param targetNodeSelector  The target node selector to place the this.
 * @param options             The options object.
 * editable: true/false,
 * enableAddRow: true/false,
 * showHeaderRow: true/false,
 * enableCellNavigation: true/false,
 * asyncEditorLoading: true/false,
 * forceFitColumns: true/false,
 * explicitInitialization: true/false,
 * topPanelHeight: Number,
 * headerRowHeight: Number,
 * showTopPanel: true,
 * sortColumn: Start Date
 * sortDir: asc/desc
 * @constructor
 */
function Viewer(targetNodeSelector, options)
{
  var _self = this;

  var $_lengthFinder =
    $("#lengthFinder")
    || $("<div id='lengthFinder'></div>").appendTo($(document.body));
  var _grid = null;
  var _columnManager = options.columnManager ? options.columnManager : {};
  var _rowManager = options.rowManager ? options.rowManager : {};

  var _$emptyResultsMessage =
    $(options.emptyResultsMessageSelector)
    ||
    $("<div class=\"cadcvotv-empty-results-message\">No results returned.</div>")
      .appendTo($(".grid-container"));

  var _columns = [];
  // displayColumns: columns that are actually in the Grid.
  var _displayColumns = options.displayColumns ? options.displayColumns : [];
  var _resizedColumns = {};  // Columns the user has resized.
  var _columnFilters = options.columnFilters ? options.columnFilters : {};
  var _columnFilterPluginName = options.columnFilterPluginName || "default";
  var _updatedColumnSelects = {};
  var _targetNodeSelector = targetNodeSelector;
  var _columnOptions = options.columnOptions ? options.columnOptions : {};
  var _options = options;
  var _pagerNodeSelector = '#pager';
  var _headerNodeSelector = 'div.grid-header';

  _options.forceFitColumns = options.columnManager
    ? options.columnManager.forceFitColumns
    : false;
  _options.asyncPostRenderDelay = options.asyncPostRenderDelay || 0;

  // This is the TableData for a VOTable.  Will be set on load.
  var _longestValues = {};

  var _sortcol = options.sortColumn;
  var _sortAsc = options.sortDir == "asc";

  // story 1584 - variable viewport height
  var _variableViewportHeight = options.variableViewportHeight
    ? options.variableViewportHeight
    : false;
  var _viewportOffset = 0;
  var _rowCountMessage = _options.rowCountMessage ? _options.rowCountMessage :
                         defaultRowCountMessage;

  var _atDataLoadComplete = options.atDataLoadComplete
    ? options.atDataLoadComplete : defaultDataLoadComplete;
  var _atPageInfoChanged = options.atPageInfoChanged
    ? options.atPageInfoChanged : defaultPageChanging;
  var _plugins = [];

  /**
   * @param input  Object representing the input.
   *
   * One of data or url is required.
   *
   * input.data = The XML DOM Object or CSV text
   * input.url = The URL of the input.  The Content-Type will dictate how to
   *             build it.  This is the only way to stream CSV.
   */
  this.build = function (input)
  {
    // Keep the empty results stuff hidden.
    $(_targetNodeSelector).removeClass("cadcvotv-empty-results-overlay");
    _$emptyResultsMessage.hide();

    var builderFactory = new opencadcVOTableReader.BuilderFactory();
    var builder = builderFactory.createBuilder(input);
    var hasDisplayColumns = (_displayColumns && (_displayColumns.length > 0));

    builder.subscribe(opencadcVOTableReader.events.onDataLoadComplete,
                      function (event, args)
                      {
                        if (args && args.longestValues)
                        {
                          _self.setLongestValues(args.longestValues);
                        }

                        if (args && args.hasOwnProperty('voTable'))
                        {
                          var voTable = args.voTable;

                          if (!hasDisplayColumns)
                          {
                            _self.refreshColumns(voTable.getMetadata().getFields());
                          }

                          // Setup the Grid and DataView to be
                          // loaded.
                          _self.init();

                          load(voTable, false, true);
                        }

                        _self.resetColumnWidths();

                        // Display spinner only
                        // if paging is off
                        if (!_self.usePager())
                        {
                          _self.atDataLoadComplete(getTotalRows(),
                                                   getCurrentRows(),
                                                   getHeaderLabel());
                        }

                        var $gridHeaderIcon =
                          _self.getHeader().find("img.grid-header-icon");

                        // clear the wait icon
                        $gridHeaderIcon.attr("src", "cadcVOTV/images/transparent-20.png");

                        if (_self.getRows().length === 0)
                        {
                          $(_targetNodeSelector).addClass("cadcvotv-empty-results-overlay");
                          _self.$emptyResultsMessage.show();
                        }

                        _self.sort();

                        _self.trigger(cadc.vot.events.onDataLoaded, args);
                      });

    // Set up to stream.
    if (input.tableMetadata)
    {
      var inputFields = input.tableMetadata.getFields();
      var $resultsGridHeader = _self.getHeader();
      var $gridHeaderIcon = $resultsGridHeader.find("img.grid-header-icon");

      // Display spinner only if paging is off
      if (!_self.usePager())
      {
        var $gridHeaderStyle = $resultsGridHeader.prop("style");

        // remove any background color resulting from
        // previous warning message
        if ($gridHeaderStyle)
        {
          $gridHeaderStyle.backgroundColor = "";
        }

        // add a spinner to the header bar to indicate
        // streaming has begun
        if ($gridHeaderIcon)
        {
          $gridHeaderIcon.attr("src",
                               "cadcVOTV/images/PleaseWait-small.gif");
        }
      }

      /*
       * We need to refresh columns twice; once to
       * display something while the data is streaming,
       * and again to update the column widths based
       * on data.
       *
       * jenkinsd 2013.12.20
       */
      if (!hasDisplayColumns)
      {
        _self.refreshColumns(inputFields);
      }

      // Setup the Grid and DataView to be loaded.
      _self.init();

      builder.subscribe(opencadcVOTableReader.events.onPageAddStart,
                        function ()
                        {
                          _self.getDataView().beginUpdate();

                          // Notify that data is loading.
                          _self.atPageInfoChanged(
                            _self.getTotalRows(),
                            _self.getCurrentRows(),
                            _self.getHeaderLabel());
                        });

      builder.subscribe(opencadcVOTableReader.events.onPageAddEnd,
                        function ()
                        {
                          _self.getDataView().endUpdate();

                          // Sorting as data
                          // loads.  Not sure
                          // if this is a good
                          // idea or not.
                          // jenkinsd
                          // 2014.05.09 WebRT
                          // 53730
                          //sort();
                        });

      builder.subscribe(opencadcVOTableReader.events.onRowAdd,
                        function (event, row)
                        {
                          _self.addRow(row, null);
                        });
    }

    builder.build();
  };

  this.defaultRowCountMessage = function (totalRows, rowCount)
  {
    return "Showing " + totalRows + " rows (" + rowCount
           + " before filtering).";
  };

  this.getRowCountMessage = function (totalRows, rowCount)
  {
    return _rowCountMessage(totalRows, rowCount);
  };

  this.getTargetNodeSelector = function ()
  {
    return _targetNodeSelector;
  };

  this.getHeader = function ()
  {
    return $(_targetNodeSelector).prev();
  };

  this.getHeaderLabel = function ()
  {
    return this.getHeader().find(".grid-header-label");
  };

  this.getColumnManager = function ()
  {
    return _columnManager;
  };

  this.getRowManager = function ()
  {
    return _rowManager;
  };

  this.getColumns = function ()
  {
    return _columns;
  };

  this.getColumnOptions = function ()
  {
    return _columnOptions;
  };

  this.setOptionsForColumn = function (columnID, _colOpts)
  {
    _columnOptions[columnID] = _colOpts;
  };

  this.getOptionsForColumn = function (columnLabel)
  {
    return this.getColumnOptions()[columnLabel]
      ? this.getColumnOptions()[columnLabel] : {};
  };

  this.getResizedColumns = function ()
  {
    return _resizedColumns;
  };

  this.getUpdatedColumnSelects = function ()
  {
    return _updatedColumnSelects;
  };

  this.setUpdatedColumnSelects = function (_updatedSelects)
  {
    _updatedColumnSelects = _updatedSelects;
  };

  this.isFilterable = function (column)
  {
    var globallyFilterable = _columnManager.filterable || false;
    var columnFilterable = column.filterable || globallyFilterable;

    return (columnFilterable === true);
  };

  /**
   * Obtain whether the global fitMax or per column fitMax option has been
   * set.
   *
   * @param columnID    The column ID to check.
   */
  this.isFitMax = function (columnID)
  {
    var columnOptions = this.getOptionsForColumn(columnID);
    var fitMaxEnabled = (_options.fitMax === true);

    if (columnOptions)
    {
      if (columnOptions.fitMax === true)
      {
        fitMaxEnabled = true;
      }
      else if (columnOptions.fitMax === false)
      {
        fitMaxEnabled = false;
      }
    }

    return fitMaxEnabled;
  };

  this.getColumnFilters = function ()
  {
    return _columnFilters;
  };

  this.setColumnFilter = function (columnID, filterValue)
  {
    $(_targetNodeSelector).find("input[id='" + columnID
                                + "_filter']").val(filterValue);
  };

  this.columnFiltersEmpty = function ()
  {
    for (var cf in _columnFilters)
    {
      if (_columnFilters.hasOwnProperty(cf))
      {
        var nextFilter = _columnFilters[cf];

        if (nextFilter && $.trim(nextFilter))
        {
          return false;
        }
      }
    }

    return true;
  };

  this.getColumnFilterPluginName = function ()
  {
    return _columnFilterPluginName;
  };

  this.clearColumnFilters = function ()
  {
    _columnFilters = {};
  };

  /**
   * Obtain a column from the Grid by its unique ID.
   * @param columnID    The Column ID.
   * @returns {Object} column definition.
   */
  this.getGridColumn = function (columnID)
  {
    var existingColumnIndex = _grid.getColumnIndex(columnID);

    return !isNaN(existingColumnIndex)
      ? _grid.getColumns()[existingColumnIndex] : null;
  };

  /**
   * Obtain the index of the given column ID.  Return the index, or -1 if it
   * does not exist.
   *
   * @param columnID
   * @returns {number}
   */
  this.getColumnIndex = function (columnID)
  {
    for (var i = 0; i < _columns.length; i++)
    {
      var nextCol = _columns[i];

      if (nextCol.id == columnID)
      {
        return i;
      }
    }

    return -1;
  };

  /**
   * Obtain a column from the CADC VOTV column cache by its unique ID.
   * @param columnID    The Column ID.
   * @returns {Object} column definition.
   */
  this.getColumn = function (columnID)
  {
    var columnIndex = this.getColumnIndex(columnID);

    return (columnIndex || (columnIndex === Number(0)))
      ? _columns[columnIndex] : null;
  };

  this.addColumn = function (columnObject)
  {
    _columns.push(columnObject);
  };

  this.setColumns = function (cols)
  {
    _columns = cols.slice(0);
  };

  this.clearColumns = function ()
  {
    _columns.length = 0;
  };

  /**
   * Add a VOTable Row.
   *
   * @param row       The cadc.vot.Row object.
   * @param rowIndex  The optional row index.
   */
  this.addRow = function (row, rowIndex)
  {
    var cellArray = row.getCells();
    var dataRow = {};

    dataRow["id"] = row.getID();
    for (var ci = 0, cl = cellArray.length; ci < cl; ci++)
    {
      var cell = cellArray[ci];
      var cellFieldID = cell.getField().getID();
      dataRow[cellFieldID] = cell.getValue();
    }

    if (_rowManager.isRowDisabled)
    {
      dataRow[cadc.vot.ROW_SELECT_DISABLED_KEY] =
        _rowManager.isRowDisabled(row);
    }

    // Add items directly to prevent unnecessary refreshes.
    if (rowIndex)
    {
      _grid.getData().getItems()[rowIndex] = dataRow;
    }
    else
    {
      _grid.getData().getItems().push(dataRow);
    }

    _self.trigger(cadc.vot.events.onRowAdded, {"rowData": dataRow});
  };

  this.clearRows = function ()
  {
    var data = _grid.getData();
    data.beginUpdate();
    data.getItems().length = 0;
    data.endUpdate();
  };

  this.getDataView = function ()
  {
    return _grid.getData();
  };

  this.getSelectedRows = function ()
  {
    return this.getGrid().getSelectedRows();
  };

  this.getRow = function (_index)
  {
    return _grid.getData().getItem(_index);
  };

  this.getRows = function ()
  {
    return _grid.getData().getItems();
  };

  this.getGrid = function ()
  {
    return _grid;
  };

  this.refreshGrid = function ()
  {
    var g = _grid;
    g.updateRowCount();
    g.invalidateAllRows();
    g.resizeCanvas();
  };

  this.getGridHeaderHeight = function ()
  {
    return ($(".grid-header").height() +
            $(".slick-header").height() +
            $(".slick-headerrow").height());
  };

  /**
   * Call if supporting a variable viewport height, and there's a static
   * header that not part of the grid container.
   */
  this.setViewportOffset = function (offset)
  {
    _viewportOffset = (offset + this.getGridHeaderHeight());
  };

  this.setViewportHeight = function ()
  {
    if (_variableViewportHeight)
    {
      $(_targetNodeSelector).height($(window).height() - _viewportOffset);
    }
  };

  /**
   * Tell the Grid to sort.  This exists mainly to set an initial sort column
   * on the Grid.
   */
  this.sort = function ()
  {
    if (_self.sortcol)
    {
      var isAscending = (_self.sortAsc || (_self.sortAsc == 1));
      _grid.setSortColumn(_self.sortcol, isAscending);

      _self.trigger(cadc.vot.events.onSort, {
        sortCol: _self.sortcol,
        sortAsc: isAscending
      });
    }
  };

  /**
   * Set the sort column.  Here mainly for testing.
   *
   * @param _sortColumn   The column ID to use.
   */
  this.setSortColumn = function (_sortColumn)
  {
    _sortcol = _sortColumn;
  };

  this.getOptions = function ()
  {
    return _options;
  };

  this.setOptions = function (_optionsDef)
  {
    _options = _optionsDef;
  };

  this.usePager = function ()
  {
    return _options.pager;
  };

  this.getLongestValues = function ()
  {
    return _longestValues;
  };

  this.getLongestValue = function (_columnID)
  {
    return _longestValues[_columnID];
  };

  this.setLongestValues = function (_newLongestValues)
  {
    _longestValues = _newLongestValues;
  };

  /**
   * Get the columns that are to BE displayed.
   * @return {Array}    Array of Column objects.
   */
  this.getDisplayColumns = function ()
  {
    if (!_self.displayColumns || (_self.displayColumns.length == 0))
    {
      this.setDisplayColumns(this.getDefaultColumns().slice(0));
    }
    return _self.displayColumns;
  };

  /**
   * Get the columns that ARE CURRENTLY displayed.  Useful for saving for
   * future profile usage (i.e. restoring previous session).
   *
   * @return {Array}    Array of Column objects.
   */
  this.getDisplayedColumns = function ()
  {
    return _grid ? _grid.getColumns() : [];
  };

  this.setDisplayColumns = function (dispCols)
  {
    _self.displayColumns = dispCols;
  };

  this.getDefaultColumns = function ()
  {
    var cols = [];
    var opts = _options;
    var defaultColumnIDs = opts.defaultColumnIDs;

    if (!defaultColumnIDs || (defaultColumnIDs.length == 0))
    {
      cols = _columns.slice(0);
    }
    else
    {
      for (var i = 0, dcii = defaultColumnIDs.length; i < dcii; i++)
      {
        var nextDefaultColumn = defaultColumnIDs[i];
        var colOpts = opts.columnOptions[nextDefaultColumn];
        var visible = colOpts ?
                      ((colOpts.visible !== undefined) ? colOpts.visible :
                       true) :
                      true;
        if (!visible)
        {
          var msg = nextDefaultColumn +
                    " should not be declared invisible and part of defaults.";
          console.error(msg);
          throw new Error(msg);
        }

        if (nextDefaultColumn)
        {
          for (var j = 0, cj = _columns.length; j < cj; j++)
          {
            if (_columns[j].id == nextDefaultColumn)
            {
              cols.push(_columns[j]);
            }
          }
        }
      }
    }

    return cols;
  };

  /**
   * TODO - There are a lot of return points in this method.  Let's try to
   * TODO - reduce them.
   * TODO - jenkinsd 2014.12.04
   *
   * @param filter             The filter value as entered by the user.
   * @param value              The value to be filtered or not
   * @returns {Boolean} true if value is filtered-out by filter.
   */
  this.valueFilters = function (filter, value)
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

        if (areNumbers(value, left, right))
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
      var filterRegexStartsWith = /^\s?(>=|<=|=|>|<)?\s?(.*)/;
      var matches = filterRegexStartsWith.exec(filter);
      var match = ((matches != null) && (matches.length > 1))
        ? $.trim(matches[1]) : null;

      var operator = (match == null) ? '' : cadc.vot.filters[match];

      if (operator)
      {
        filter = filter.substring(match.length);
      }

      var exactMatch = (match === "=");

      // act on the operator and value
      value = $.trim(value);

      var isFilterNumber = isNumber(filter);

      // Special case for those number filter expectations where the data is
      // absent.
      if (isFilterNumber
          && ((value == "") || (value == "NaN") || (value == Number.NaN)))
      {
        return true;
      }
      else if (operator && !filter)
      {
        return false;
      }
      else if (operator === 'gt')
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
      else if (operator == 'lt')
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
          return value >= filter;
        }
      }
      else if (operator == 'ge')
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
          return value < filter;
        }
      }
      else if (operator == 'le')
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
          return value > filter;
        }
      }
      else if (exactMatch === true)
      {
        return (value.toString().toUpperCase()
                !== filter.toString().toUpperCase());
      }
      else
      {
        filter = $.ui.autocomplete.escapeRegex(filter);

        var regex = new RegExp(filter, "gi");
        var result = value.match(regex);

        return (!result || result.length == 0);
      }
    }
  };

  this.isNumber = function (val)
  {
    return !isNaN(parseFloat(val)) && isFinite(val);
  };

  this.areNumbers = function ()
  {
    for (var i = 0; i < arguments.length; i++)
    {
      if (!isNumber(arguments[i]))
      {
        return false;
      }
    }
    return true;
  };

  this.areStrings = function ()
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

  /**
   * Calculate the width of a column from its longest value.
   * @param _column     The column to calculate for.
   * @returns {number}  The integer width.
   */
  this.calculateColumnWidth = function (_column)
  {
    var columnName = _column.name;
    var colOpts = this.getOptionsForColumn(_column.id);
    var minWidth = columnName.length;
    var longestCalculatedWidth = this.getLongestValue(_column.id);
    var textWidthToUse = (longestCalculatedWidth > minWidth)
      ? longestCalculatedWidth : minWidth;

    var lengthStr = "";
    var userColumnWidth = colOpts.width;

    for (var v = 0; v < textWidthToUse; v++)
    {
      lengthStr += "_";
    }

    $_lengthFinder.addClass(_column.name);
    $_lengthFinder.text(lengthStr);

    var width = ($_lengthFinder.width() + 1);
    var colWidth = (userColumnWidth || width);

    $_lengthFinder.removeClass(_column.name);
    $_lengthFinder.empty();

    // Adjust width for cell padding.
    return colWidth;
  };

  /**
   * Used for resetting the force fit column widths.
   */
  this.resetColumnWidths = function ()
  {
    for (var i = 0; i < _columns.length; i++)
    {
      var col = _columns[i];
      var initialWidth = this.getOptionsForColumn(col.id).width;

      if (initialWidth && (initialWidth !== Number(0)))
      {
        col.width = initialWidth;
      }
      else
      {
        this.setColumnWidth(col);
      }
    }

    var gridColumns = _grid.getColumns();
    var dupGridColumns = [];
    var totalWidth = 0;

    // Handle the visible columns
    for (var j = 0, jl = gridColumns.length; j < jl; j++)
    {
      var gridColumn = gridColumns[j];
      var existingColumn = this.getColumn(gridColumn.id);

      // Update the equivalent in the grid, if it's there.
      if (existingColumn)
      {
        gridColumn.width = existingColumn.width;
      }

      totalWidth += gridColumn.width;

      dupGridColumns.push(gridColumn);
    }

    _grid.setColumns(dupGridColumns);

    if (totalWidth > 0)
    {
      $(_targetNodeSelector).css("width", (totalWidth + 15) + "px");

      if (this.usePager())
      {
        $(_pagerNodeSelector).css("width", (totalWidth + 15) + "px");
      }

      $(_headerNodeSelector).css("width", (totalWidth + 15) + "px");
    }

    _self.refreshGrid();
  };

  this.setColumnWidth = function (_columnDefinition)
  {
    // Do not calculate with checkbox column.
    if ((_columnDefinition.id != cadc.vot.CHECKBOX_SELECTOR_COLUMN_ID)
        && (this.isFitMax(_columnDefinition.id) || _options.forceFitColumns))
    {
      _columnDefinition.width = this.calculateColumnWidth(_columnDefinition);
    }
  };

  /**
   * Perform the filter of data.  This is typically called from the input
   * field, but is useful as a test function here.
   *
   * @param _value      The input value.
   * @param _columnID   The Column ID to tie to.
   */
  this.doFilter = function (_value, _columnID)
  {
    if (_columnID)
    {
      var filter = $.trim(_value);
      _self.setColumnFilter(_columnID, filter);
      _columnFilters[_columnID] = filter;

      $(_self.getGridColumn(_columnID)).data("pureFilterValue", filter);

      _self.getDataView().refresh();

      _self.trigger(cadc.vot.events.onFilterData, null);
    }
  };

  this.setupHeader = function (checkboxSelector, args)
  {
    $(args.node).empty();

    // Display the label for the checkbox column filter row.
    if (checkboxSelector
        && (args.column.id == checkboxSelector.getColumnDefinition().id))
    {
      $("<div class='filter-boxes-label' "
        +
        "title='Enter values into the boxes to further filter results.'>Filter:</div>").appendTo(args.node);
    }
    // Do not display for the checkbox column.
    else if (this.isFilterable(args.column))
    {
      var datatype = args.column.datatype;
      var tooltipTitle;

      if (datatype.isNumeric())
      {
        tooltipTitle =
          "Number: 10 or >=10 or 10..20 for a range , ! to negate";
      }
      else
      {
        tooltipTitle = "String: Substring match , ! to negate matches";
      }

      var $filterInput =
        $("<input type='text'>")
          .data("columnId", args.column.id)
          .val(getColumnFilters()[args.column.id])
          .attr("title", tooltipTitle)
          .attr("id", args.column.id + "_filter")
          .addClass("form-control").addClass("cadcvotv-filter-input")
          .appendTo(args.node);

      // Story 1647
      //
      // Having a big if/else is really a bad idea, but I don't know how to
      // dynamically specify a plugin name.
      //
      // jenkinsd 2014.12.03
      //
      if (this.getColumnFilterPluginName() === "suggest")
      {
        $filterInput.cadcVOTV_filter_suggest(_self,
                                             _self.options.suggest_maxRowCount);
      }
      else
      {
        $filterInput.cadcVOTV_filter_default(_self);
      }
    }
    else
    {
      // Allow for overrides per column.
      $("<span class=\"empty\"></span>").appendTo(args.node);
      $(args.node).css("height", "100%");
    }
  };

  this.registerPlugin = function (plugin)
  {
    _self.plugins.unshift(plugin);
    plugin.init(_self);
  };

  this.unregisterPlugin = function (plugin)
  {
    for (var i = _self.plugins.length; i >= 0; i--)
    {
      if (_self.plugins[i] === plugin)
      {
        if (_self.plugins[i].destroy)
        {
          _self.plugins[i].destroy();
        }
        _self.plugins.splice(i, 1);
        break;
      }
    }
  };

  /**
   * Initialize this VOViewer.
   */
  this.init = function ()
  {
    var columnManager = _self.columnManager;
    var forceFitMax = (columnManager.forceFitColumns
                       && columnManager.forceFitColumnMode
                       && (columnManager.forceFitColumnMode
                           === "max"));
    var checkboxSelector;
    var enableSelection = !_self.options.enableSelection
                          || (_self.options.enableSelection === true);

    if ((typeof CADC !== 'undefined') && CADC.CheckboxSelectColumn)
    {
      checkboxSelector = new CADC.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel",
        width: cadc.vot.CHECKBOX_SELECTOR_DEFAULT_WIDTH,
        headerCssClass: "slick-header-column-checkboxsel",
        headerCheckboxLabel: _self.options.headerCheckboxLabel,
        enableOneClickDownload: _self.options.enableOneClickDownload,
        oneClickDownloadURL: _self.options.oneClickDownloadURL,
        oneClickDownloadTitle: _self.options.oneClickDownloadTitle,

        // The ID of the column to pull the unique link from.
        oneClickDownloadURLColumnID: _self.options.oneClickDownloadURLColumnID
      });
    }
    else if (Slick.CheckboxSelectColumn)
    {
      checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel",
        width: cadc.vot.CHECKBOX_SELECTOR_DEFAULT_WIDTH,
        headerCssClass: "slick-header-column-checkboxsel"
      });
    }
    else
    {
      checkboxSelector = null;
    }

    if (checkboxSelector && enableSelection)
    {
      var checkboxColumn = checkboxSelector.getColumnDefinition();
      var colsToCheck = (this.getDisplayColumns().length == 0)
        ? _columns : this.getDisplayColumns();

      var checkboxColumnIndex = -1;

      $.each(colsToCheck, function (index, val)
      {
        if (checkboxColumn.id == val.id)
        {
          checkboxColumnIndex = index;
        }
      });

      if (checkboxColumnIndex < 0)
      {
        _columns.splice(0, 0, checkboxColumn);
        this.getDisplayColumns().splice(0, 0, checkboxColumn);
      }
      else
      {
        _columns[checkboxColumnIndex] = checkboxColumn;
        this.getDisplayColumns()[checkboxColumnIndex] = checkboxColumn;
      }
    }

    _options.defaultFormatter = function (row, cell, value, columnDef,
                                          dataContext)
    {
      var returnValue = (value == null) ? ''
        :
                        value.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      return "<span class='cellValue " + columnDef.id
             + "' title='" + returnValue + "'>" + returnValue + "</span>";
    };

    var dataView = new Slick.Data.DataView({inlineFilters: true});
    _grid = new Slick.Grid(_targetNodeSelector, dataView,
      this.getDisplayColumns(), getOptions());
    var rowSelectionModel;

    if (checkboxSelector)
    {
      if ((typeof CADC !== 'undefined')
          && (typeof CADC.RowSelectionModel !== 'undefined'))
      {
        rowSelectionModel =
          new CADC.RowSelectionModel({
            selectActiveRow: getOptions().selectActiveRow,
            selectClickedRow: getOptions().selectClickedRow,
            propagateEvents: getOptions().propagateEvents
          });
      }
      else if (Slick.RowSelectionModel)
      {
        rowSelectionModel =
          new Slick.RowSelectionModel({
            selectActiveRow: getOptions().selectActiveRow
          });
      }
      else
      {
        rowSelectionModel = null;
      }

      if (rowSelectionModel)
      {
        _grid.setSelectionModel(rowSelectionModel);
      }

      _grid.registerPlugin(checkboxSelector);
    }
    else
    {
      rowSelectionModel = null;
    }

    if (this.usePager())
    {
      new Slick.Controls.Pager(dataView, _grid, $(_pagerNodeSelector));
    }
    else
    {
      dataView.onPagingInfoChanged.subscribe(function ()
                                             {
                                               _self.atDataLoadComplete(
                                                 _self.getTotalRows(),
                                                 _self.getCurrentRows(),
                                                 _self.getHeaderLabel());
                                             });
    }

    dataView.onRowCountChanged.subscribe(function (e, args)
                                         {
                                           _self.trigger(cadc.vot.events.onRowsChanged,
                                                         args);
                                         });

    var columnPickerConfig = _columnManager.picker;

    if (columnPickerConfig)
    {
      var columnPicker;
      var pickerStyle = columnPickerConfig.style;

      if (pickerStyle == "dialog")
      {
        columnPicker =
          new cadc.vot.picker.DialogColumnPicker(_columns, _grid,
            columnPickerConfig.options);

        if (forceFitMax)
        {
          cadc.vot.picker.events.onSort.subscribe(_self.resetColumnWidths);
          cadc.vot.picker.events.onResetColumnOrder.subscribe(_self.resetColumnWidths);
          cadc.vot.picker.events.onShowAllColumns.subscribe(_self.resetColumnWidths);
          cadc.vot.picker.events.onSortAlphabetically.subscribe(_self.resetColumnWidths);
        }

        cadc.vot.picker.events.onColumnAddOrRemove.subscribe(function ()
                                                             {
                                                               if (rowSelectionModel)
                                                               {
                                                                 // Refresh.
                                                                 rowSelectionModel.refreshSelectedRanges();
                                                               }
                                                             });

        cadc.vot.picker.events.onResetColumnOrder.subscribe(function ()
                                                            {
                                                              // Clear the
                                                              // hash.
                                                              parent.location.hash =
                                                                '';
                                                              _self.trigger(cadc.vot.events.onColumnOrderReset, null);
                                                            });
      }
      else if (pickerStyle == "header")
      {
        columnPicker = new Slick.Controls.ColumnPicker(_columns, _grid,
          _options);
        if (forceFitMax)
        {
          columnPicker.onColumnAddOrRemove.subscribe(_self.resetColumnWidths);
        }

        columnPicker.onResetColumnOrder.subscribe(function ()
                                                  {
                                                    // Clear the hash.
                                                    parent.location.hash = '';
                                                    _self.trigger(cadc.vot.events.onColumnOrderReset, null);
                                                  });
      }
      else if (pickerStyle == "tooltip")
      {
        columnPicker =
          new Slick.Controls.PanelTooltipColumnPicker(_columns,
            _grid,
            columnPickerConfig.panel,
            columnPickerConfig.tooltipOptions,
            columnPickerConfig.options);

        if (forceFitMax)
        {
          columnPicker.onSort.subscribe(_self.resetColumnWidths);
          columnPicker.onResetColumnOrder.subscribe(_self.resetColumnWidths);
          columnPicker.onShowAllColumns.subscribe(_self.resetColumnWidths);
          columnPicker.onSortAlphabetically.subscribe(_self.resetColumnWidths);
        }

        columnPicker.onColumnAddOrRemove.subscribe(function ()
                                                   {
                                                     if (rowSelectionModel)
                                                     {
                                                       // Refresh.
                                                       rowSelectionModel.refreshSelectedRanges();
                                                     }
                                                   });

        columnPicker.onResetColumnOrder.subscribe(function ()
                                                  {
                                                    // Clear the hash.
                                                    parent.location.hash = '';
                                                    _self.trigger(cadc.vot.events.onColumnOrderReset, null);
                                                  });
      }
      else
      {
        columnPicker = null;
      }
    }

    if (forceFitMax)
    {
      var totalWidth = 0;
      var gridColumns = _grid.getColumns();

      for (var c in gridColumns)
      {
        var nextCol = gridColumns[c];
        totalWidth += nextCol.width;
      }

      $(_targetNodeSelector).css("width", totalWidth + "px");

      if (this.usePager())
      {
        $(_pagerNodeSelector).css("width", totalWidth + "px");
      }

      $(_headerNodeSelector).css("width", totalWidth + "px");
      _grid.resizeCanvas();
    }

    // move the filter panel defined in a hidden div into grid top panel
    $("#inlineFilterPanel").appendTo(_grid.getTopPanel()).show();

    _grid.onKeyDown.subscribe(function (e)
                                   {
                                     // select all rows on ctrl-a
                                     if ((e.which != 65) || !e.ctrlKey)
                                     {
                                       return false;
                                     }

                                     var rows = [];
                                     for (var i = 0;
                                          i < _grid.getDataLength();
                                          i++)
                                     {
                                       rows.push(i);
                                     }

                                     _grid.setSelectedRows(rows);
                                     e.preventDefault();

                                     return true;
                                   });

    /**
     * Tell the dataview to do the comparison.
     */
    var doGridSort = function ()
    {
      if (_self.sortcol)
      {
        var sortColumn = _self.getColumn(_self.sortcol);

        // In the odd chance that the sort column is not in the displayed
        // column list.
        if (sortColumn)
        {
          var isnumeric = sortColumn.datatype.isNumeric();
          sortColumn.comparer.setIsNumeric(isnumeric);
          sortColumn.comparer.setSortColumn(_sortcol);

          var data = _grid.getData();

          // using native sort with comparer
          // preferred method but can be very slow in IE
          // with huge datasets
          data.sort(sortColumn.comparer.compare, _sortAsc);
          data.refresh();
        }

        _self.refreshGrid();
      }
    };

    /**
     * Handle the local sort events.  These events are fired for the initial
     * sort when the Grid is loaded, if any.
     *
     * WebRT 53730
     */
    _self.subscribe(cadc.vot.events.onSort, function (eventData, args)
    {
      _sortAsc = args.sortAsc;
      _sortcol = args.sortCol;

      doGridSort();
    });

    /**
     * Handle the Grid sorts.
     */
    _grid.onSort.subscribe(function (e, args)
                           {
                             _sortAsc = args.sortAsc;
                             _sortcol = args.sortCol.field;

                             doGridSort();
                           });

    if (_rowManager.onRowRendered)
    {
      _grid.onRenderComplete.subscribe(function (e, args)
                                            {
                                              var renderedRange = args.grid.getRenderedRange();
                                              for (var i = renderedRange.top,
                                                     ii = renderedRange.bottom;
                                                   i <= ii; i++)
                                              {
                                                var $nextRow =
                                                  args.grid.getData().getItem(i);
                                                _rowManager.onRowRendered($nextRow, i);
                                              }
                                            });
    }

    dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo)
                                           {
                                             var isLastPage =
                                               (pagingInfo.pageNum ==
                                                pagingInfo.totalPages - 1);
                                             var enableAddRow =
                                               (isLastPage ||
                                                pagingInfo.pageSize == 0);
                                             var options = _grid.getOptions();

                                             if (options.enableAddRow !=
                                                 enableAddRow)
                                             {
                                               _grid.setOptions({enableAddRow: enableAddRow});
                                             }
                                           });

    $(window).resize(function ()
                     {
                       _self.setViewportHeight();
                       _grid.resizeCanvas();
                       _grid.invalidateAllRows();
                       _grid.render();
                     });

    _grid.onHeaderRowCellRendered.subscribe(function (e, args)
                                                 {
                                                   _self.setupHeader(checkboxSelector,
                                                               args);
                                                 });

    if (Slick.Plugins && Slick.Plugins.UnitSelection)
    {
      var unitSelectionPlugin = new Slick.Plugins.UnitSelection({});

      // Extend the filter row to include the pulldown menu.
      unitSelectionPlugin.onUnitChange.subscribe(function (e, args)
                                                 {
                                                   if (columnPicker.updateColumnData)
                                                   {
                                                     columnPicker.updateColumnData(
                                                       args.column.id,
                                                       "unitValue",
                                                       args.unitValue);
                                                   }

                                                   // track select changes.
                                                   _self.updatedColumnSelects[args.column.id] =
                                                     args.unitValue;

                                                   // Invalidate to force
                                                   // column reformatting.
                                                   _grid.invalidate();

                                                   _self.trigger(cadc.vot.events.onUnitChanged,
                                                           args);
                                                 });

      _grid.registerPlugin(unitSelectionPlugin);
    }

    // VOTable viewer plugins.
    var enabledPlugins = this.getEnabledPlugins();

    for (var enabledPluginName in enabledPlugins)
    {
      this.registerPlugin(new cadc.vot.plugin[enabledPluginName](
        enabledPlugins[enabledPluginName]));
    }
    // End VOTable Viewer plugins.

    // Track the width of resized columns.
    _grid.onColumnsResized.subscribe(function (e, args)
                                          {
                                            var columns = args.grid.getColumns();

                                            for (var i = 0, ci = columns.length;
                                                 i < ci; i++)
                                            {
                                              var column = columns[i];

                                              if (column.width !==
                                                  column.previousWidth)
                                              {
                                                _self.getResizedColumns[column.id] =
                                                  column.width;
                                                return false;
                                              }
                                            }
                                          });

    if (forceFitMax)
    {
      this.resetColumnWidths();
    }

    this.sort();
  };

  /**
   * Load a fresh copy into this this.  This assumes first time load.
   *
   * @param voTable         The built VOTable.
   * @param _refreshColumns  Whether to refresh the columns (true/false).
   * @param _refreshData     Whether to refresh the data (true/false).
   */
  this.load = function (voTable, _refreshColumns, _refreshData)
  {
    // Use the first Table of the first Resource only.
    var resource = voTable.getResources()[0];

    if (!resource)
    {
      throw new Error("No resource available.");
    }

    var table = resource.getTables()[0];

    if (!table)
    {
      throw new Error("No table available.");
    }

    this.setLongestValues(table.getTableData().getLongestValues());

    if (_refreshColumns)
    {
      this.refreshColumns(table.getFields());
    }

    if (_refreshData)
    {
      this.refreshData(table);
    }
  };

  /**
   * Refresh this Viewer's columns.
   *
   * WARNING: This will clear ALL of the columns, including the checkbox
   * selector column.  Generally, this method will only be called to
   * initialize the columns from the init() method, or when first building
   * the viewer.
   *
   * @param _fields   A Table in the VOTable.
   */
  this.refreshColumns = function (_fields)
  {
    this.clearColumns();

    for (var fi = 0, fl = _fields.length; fi < fl; fi++)
    {
      var field = _fields[fi];
      var fieldKey = field.getID();
      var colOpts = this.getOptionsForColumn(fieldKey);
      var cssClass = colOpts.cssClass;
      var datatype = field.getDatatype();
      var filterable = (_columnManager.filterable === true);

      if (colOpts)
      {
        if (colOpts.filterable === true)
        {
          filterable = true;
        }
        else if (colOpts.filterable === false)
        {
          filterable = false;
        }
      }

      // We're extending the column properties a little here.
      var columnObject =
        {
          id: fieldKey,
          name: field.getName(),
          field: fieldKey,
          formatter: colOpts.formatter,
          valueFormatter: colOpts.valueFormatter
                          || function (value)
                          {
                            return value;
                          },
          asyncPostRender: colOpts.asyncFormatter,
          cssClass: cssClass,
          description: field.getDescription(),
          resizable: _columnManager.resizable,
          sortable: colOpts.sortable ? colOpts.sortable : true,

          // VOTable attributes.
          unit: field.getUnit(),
          utype: field.getUType(),
          filterable: filterable,
          comparer: colOpts.comparer ? colOpts.comparer :
                    new cadc.vot.Comparer()
        };

      // Default is to be sortable.
      columnObject.sortable =
        ((colOpts.sortable != null) && (colOpts.sortable != undefined))
          ? colOpts.sortable : true;

      if (datatype)
      {
        columnObject.datatype = datatype;
      }

      columnObject.header = colOpts.header;

      if (colOpts.width)
      {
        columnObject.width = colOpts.width;
      }
      else if (_columnManager.forceFitColumns || this.isFitMax(columnObject.id))
      {
        columnObject.width = this.calculateColumnWidth(columnObject);
      }

      this.addColumn(columnObject);
    }
  };

  /**
   * Format the value in the cell according to the current unit.
   *
   * @param rowItem       The current row.
   * @param grid          The Grid instance.
   * @param columnID      The ID of the column.
   * @returns {*}         Formatted value.
   */
  this.formatCellValue = function (rowItem, grid, columnID)
  {
    var columnIndex = grid.getColumnIndex(columnID);
    var column = grid.getColumns()[columnIndex];
    var cellValue = rowItem[column.field];
    var valueFormatter = column.valueFormatter;

    return valueFormatter(cellValue, column);
  };

  /**
   * Function for the search filter to run.  This is meant to be in the
   * context of the dataView, so 'this' will refer to the current instance of
   * the data view.
   *
   * @param item      Filter item.
   * @param args      columnFilters - columnFilter object.
   *                  grid - grid object.
   *                  doFilter - filter method.
   * @returns {boolean}
   */
  this.searchFilter = function (item, args)
  {
    var filters = args.columnFilters;
    var grid = args.grid;

    for (var columnId in filters)
    {
      var filterValue = filters[columnId];
      if ((columnId !== undefined) && (filterValue !== ""))
      {
        var cellValue = args.formatCellValue(item, grid, columnId);

        filterValue = $.trim(filterValue);
        var negate = filterValue.indexOf("!") == 0;

        if (negate)
        {
          filterValue = filterValue.substring(1);
        }

        // The args.doFilter method is in the Grid's DataView object.
        var filterOut = args.doFilter(filterValue, cellValue);

        if ((!negate && filterOut) || (!filterOut && negate))
        {
          return false;
        }
      }
    }

    return true;
  };

  /**
   * Clean refresh of the data rows.
   *
   * @param table   A Table element from a VOTable.
   */
  this.refreshData = function (table)
  {
    this.clearRows();

    // Make a copy of the array so as not to disturb the original.
    var allRows = table.getTableData().getRows();

    $.each(allRows, function (rowIndex, row)
    {
      _self.addRow(row, rowIndex);
    });
  };

  this.render = function ()
  {
    var g = _grid;
    var dataView = g.getData();

    // initialize the model after all the events have been hooked up
    dataView.beginUpdate();
    dataView.setFilterArgs({
                             columnFilters: getColumnFilters(),
                             grid: g,
                             formatCellValue: _self.formatCellValue,
                             doFilter: _self.valueFilters
                           });

    dataView.setFilter(_self.searchFilter);
    dataView.endUpdate();

    if (g.getSelectionModel())
    {
      // If you don't want the items that are not visible (due to being
      // filtered out or being on a different page) to stay selected, pass
      // 'false' to the second arg
      dataView.syncGridSelection(g, true);
    }

    var gridContainer = $(_targetNodeSelector);

    if (gridContainer.resizable && getOptions().gridResizable)
    {
      gridContainer.resizable();
    }

    g.init();
  };

  /**
   * Fire an event.  Taken from the slick.grid Object.
   *
   * @param _event       The Event to fire.
   * @param _args        Arguments to the event.
   * @returns {*}       The event notification result.
   */
  this.trigger = function (_event, _args)
  {
    var args = _args || {};
    args.application = _self;

    return $(this).trigger(_event, args);
  };

  /**
   * Subscribe to one of this form's events.
   *
   * @param _event      Event object.
   * @param __handler   Handler function.
   */
  this.subscribe = function (_event, __handler)
  {
    $(this).off(event.type).on(_event.type, __handler);
  };

  this.unsubscribe = function (_event)
  {
    $(this).off(_event.type);
  };

  /**
   * Remove event subscriptions and all that.
   */
  this.destroy = function ()
  {
    if (_grid)
    {
      this.clearRows();
      _grid.destroy();
    }

    var i = _plugins.length;
    while (i--)
    {
      this.unregisterPlugin(_plugins[i]);
    }

    // Unsubscribe all events.
    $(this).off();
  };

  this.defaultDataLoadComplete = function ()
  {
    var $gridHeaderLabel = this.getHeaderLabel();
    var totalRows = this.getTotalRows();
    var message = this.getRowCountMessage(totalRows,
                                          this.getCurrentRows());

    if (options.maxRowLimit <= totalRows)
    {
      // and display warning message if maximum row limit is reached
      message += " " + options.maxRowLimitWarning;
      this.getHeader().css("background-color", "rgb(235, 235, 49)");
    }

    $gridHeaderLabel.text(message);
  };

  this.defaultPageChanging = function (count1, count2, $label)
  {
    $label.text(this.getRowCountMessage(count1, count2));
  };

  this.getTotalRows = function ()
  {
    return _grid.getDataLength();
  };

  /**
   * Return an object containing all of the enabled plugins requested.
   *
   * @returns {{}}
   */
  this.getEnabledPlugins = function ()
  {
    var enabledPlugins = {};
    var opts = getOptions();

    if (opts.hasOwnProperty("plugins"))
    {
      var plugins = opts.plugins;
      for (var pluginName in plugins)
      {
        if (plugins.hasOwnProperty(pluginName))
        {
          var plugin = plugins[pluginName];

          if (plugin.hasOwnProperty("enabled") && (plugin.enabled === true))
          {
            enabledPlugins[pluginName] = plugin;
          }
        }
      }
    }

    return enabledPlugins;
  };

  this.getCurrentRows = function ()
  {
    return _grid.getData().getItems().length;
  };

  this.getDefaultColumnIDs = function ()
  {
    return _options.defaultColumnIDs;
  };

  //
  // $.extend(this,
  //          {
  //            "init": init,
  //            "build": build,
  //            "render": render,
  //            "load": load,
  //            "doFilter": doFilter,
  //            "areNumbers": areNumbers,
  //            "areStrings": areStrings,
  //            "getOptions": getOptions,
  //            "setOptions": setOptions,
  //            "refreshGrid": refreshGrid,
  //            "getGrid": getGrid,
  //            "getDataView": getDataView,
  //            "getColumn": getGridColumn,
  //            "getColumns": getColumns,
  //            "setColumns": setColumns,
  //            "clearColumns": clearColumns,
  //            "getSelectedRows": getSelectedRows,
  //            "getRow": getRow,
  //            "getRows": getRows,
  //            "addRow": addRow,
  //            "destroy": destroy,
  //            "clearColumnFilters": clearColumnFilters,
  //            "getColumnFilters": getColumnFilters,
  //            "setColumnFilter": setColumnFilter,
  //            "setDisplayColumns": setDisplayColumns,
  //            "getDisplayedColumns": getDisplayedColumns,
  //            "getDefaultColumns": getDefaultColumns,
  //            "valueFilters": valueFilters,
  //            "searchFilter": searchFilter,
  //            "formatCellValue": formatCellValue,
  //            "setSortColumn": setSortColumn,
  //            "getResizedColumns": getResizedColumns,
  //            "getUpdatedColumnSelects": getUpdatedColumnSelects,
  //            "setUpdatedColumnSelects": setUpdatedColumnSelects,
  //            "getDefaultColumnIDs": getDefaultColumnIDs,
  //            "setViewportHeight": setViewportHeight,
  //            "setViewportOffset": setViewportOffset,
  //            "getOptionsForColumn": getOptionsForColumn,
  //            "setOptionsForColumn": setOptionsForColumn,
  //
  //            // Used for testing
  //            "setupHeader": setupHeader,
  //
  //            // Event subscription
  //            "subscribe": subscribe,
  //            "unsubscribe": unsubscribe
  //          });
}

exports.Viewer = Viewer;
