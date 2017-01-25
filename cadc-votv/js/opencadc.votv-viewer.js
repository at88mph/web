'use strict';

var w = (!window) ? this : window;
global.window = w;

var $ = require('jquery');
var jQuery = $;
var StringUtil = require('opencadc-js').util.StringUtil;

require('slickgrid/lib/jquery.event.drag-2.3.0');
require('slickgrid/lib/jquery-ui-1.11.3');
require('slickgrid/slick.core');

global.Slick = global.window.Slick;

require('slickgrid/slick.dataview');
require('slickgrid/slick.grid');

var opencadcVOBuilder = require('../js/opencadc.votv-builder');
var opencadcVOComparer = require('../js/cadc.votv.comparer');
var opencadcVOFilter = require('../js/opencadc.votv-filter');
var applicationEvents = {
  onDataLoaded: new jQuery.Event('opencadc-votv:onDataLoaded'),
  onRowAdded: new jQuery.Event('opencadc-votv:onRowAdded'),
  onSort: new jQuery.Event('opencadc-votv:onSort'),
  onUnitChanged: new jQuery.Event('opencadc-votv:onUnitChanged'),
  onFilterData: new jQuery.Event('opencadc-votv:onFilterData'),
  onRowsChanged: new jQuery.Event('opencadc-votv:onRowsChanged'),
  onColumnOrderReset: new jQuery.Event('opencadc-votv:onColumnOrderReset')
};

// var _DEFAULT_CELL_PADDING_PX_ = 8;
var _CHECKBOX_SELECTOR_DEFAULT_WIDTH_ = 50;
var _CHECKBOX_SELECTOR_COLUMN_ID_ = '_checkbox_selector';
var _ROW_SELECT_DISABLED_KEY_ = '_ROW_SELECT_DISABLED_';
var _PAGER_NODE_SELECTOR_ = '#pager';
var _HEADER_NODE_SELECTOR_ = 'div.grid-header';
var _DEFAULT_ROW_COUNT_MESSAGE_FORMAT_ =
  'Showing {1} rows ({2} before filtering).';

/**
 * Create a VOView object.  This is here to package everything together.
 *
 * @param _targetNodeSelector  The target node selector to place the this.
 * @param _opts             The options object.
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
 * maxRowLimit: Max allowed row count
 * @constructor
 */
function Viewer(_targetNodeSelector, _opts)
{
  this.$_lengthFinder =
    $('#lengthFinder')
    || $('<div id="lengthFinder"></div>').appendTo($(document.body));
  this._$emptyResultsMessage =
    $(_opts.emptyResultsMessageSelector)
    ||
    $('<div class="cadcvotv-empty-results-message">No results returned.</div>')
      .appendTo($('.grid-container'));

  this.grid = null;
  this.options = _opts;
  this.columns = [];
  this.plugins = [];
  this.displayColumns = this.options.displayColumns || [];
  this.resizedColumns = {};  // Columns the user has resized.
  this.columnFilters = this.options.columnFilters || {};
  this.updatedColumnSelects = {};
  this.targetNodeSelector = _targetNodeSelector;

  // displayColumns: columns that are actually in the Grid.
  // var _columnFilterPluginName = options.columnFilterPluginName || 'default';
  // var _columnOptions = options.columnOptions ? options.columnOptions : {};

  // this.options.forceFitColumns = options.columnManager
  //   ? options.columnManager.forceFitColumns
  //   : false;
  // this.options.asyncPostRenderDelay = options.asyncPostRenderDelay || 0;

  // This is the TableData for a VOTable.  Will be set on load.
  this.longestValues = {};

  this.sortColumn = this.options.sortColumn;
  this.isSortAscending = (this.options.sortDir === 'asc');

  // story 1584 - variable viewport height
  // var _variableViewportHeight = opts.variableViewportHeight
  //   ? opts.variableViewportHeight
  //   : false;
  this.viewportOffset = 0;
  // var _rowCountMessage = this.options.rowCountMessage
  //   ? this.options.rowCountMessage : _defaultRowCountMessage;

  this._defaultDataLoadComplete = function (_totalRowCount, _currentRowCount,
                                            _headerLabel)
  {
    var stringUtil = new StringUtil();
    var message = stringUtil.format(_DEFAULT_ROW_COUNT_MESSAGE_FORMAT_,
                                    [_totalRowCount, _currentRowCount]);

    if (this.options.maxRowLimit <= _totalRowCount)
    {
      // and display warning message if maximum row limit is reached
      message += ' ' + this.options.maxRowLimitWarning;
      this.getHeader().css('background-color', 'rgb(235, 235, 49)');
    }

    _headerLabel.text(message);
  };

  this.dataLoadComplete = this.options.atDataLoadComplete
                          || this._defaultDataLoadComplete;
  this.pageInfoChanged = this.options.atPageInfoChanged
                         || this._defaultPageChanging;
}

/**
 * @param input  Object representing the input.
 *
 * One of data or url is required.
 *
 * input.data = The XML DOM Object or CSV text
 * input.url = The URL of the input.  The Content-Type will dictate how to
 *             build it.  This is the only way to stream CSV.
 */
Viewer.prototype.build = function (input)
{
  // Keep the empty results stuff hidden.
  $(this.targetNodeSelector).removeClass('cadcvotv-empty-results-overlay');
  this.toggleEmptyResultsMessage(false);

  var hasDisplayColumns = (this.displayColumns.length > 0);
  var builderFactory = new opencadcVOBuilder.BuilderFactory();
  var builder = builderFactory.createBuilder(input);
  var inputFields = input.tableMetadata ? input.tableMetadata.getFields() : [];
  var $resultsGridHeader = this.getHeader();
  var $gridHeaderIcon = $resultsGridHeader.find('img.grid-header-icon');

  // Display spinner only if paging is off
  if (!this.usePager())
  {
    var $gridHeaderStyle = $resultsGridHeader.prop('style');

    // remove any background color resulting from
    // previous warning message
    if ($gridHeaderStyle)
    {
      $gridHeaderStyle.backgroundColor = '';
    }

    // add a spinner to the header bar to indicate
    // streaming has begun
    if ($gridHeaderIcon)
    {
      $gridHeaderIcon.attr('src',
                           'cadcVOTV/images/PleaseWait-small.gif');
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
  if (!hasDisplayColumns && (inputFields.length > 0))
  {
    this.refreshColumns(inputFields);
  }

  // Setup the Grid and DataView to be loaded.
  this.init();

  /**
   * Event handler for data load complete.
   *
   * @param event   The Event object.
   * @param args    The Event data.
   */
  var dataLoadCompleteFn = function (event, args)
  {
    var viewer = this;

    if (args.hasOwnProperty('longestValues'))
    {
      viewer.setLongestValues(args.longestValues);
    }

    if (args.tableMetaData)
    {
      if (!hasDisplayColumns)
      {
        viewer.refreshColumns(args.tableMetaData.getFields());
      }

      // Setup the Grid and DataView to be loaded.
      // viewer.init();
    }

    viewer.resetColumnWidths();

    // Display spinner only if paging is off.
    if (!viewer.usePager())
    {
      viewer.dataLoadComplete(viewer.getTotalRows(),
                              viewer.getCurrentRows(),
                              viewer.getHeaderLabel());
    }

    var $gridHeaderIcon =
      viewer.getHeader().find('img.grid-header-icon');

    // clear the wait icon
    $gridHeaderIcon.attr('src', 'cadcVOTV/images/transparent-20.png');

    if (viewer.getRows().length === 0)
    {
      $(viewer.getTargetNodeSelector()).addClass(
        'cadcvotv-empty-results-overlay');
      viewer.toggleEmptyResultsMessage(true);
    }

    viewer.sort();
    viewer.trigger(applicationEvents.onDataLoaded, args);
  };

  /**
   * Event handler for when a new page of data begins.
   * @param e       The Event.
   * @param args    Event data.
   */
  var pageAddStartFn = function (e, args)
  {
    var data = args.dataView;

    data.beginUpdate();

    // Notify that data is loading.
    this.pageInfoChanged(
      data.getLength(),
      data.getItems().length,
      this.getHeaderLabel());
  };

  /**
   * Event handler for a new row of data.
   *
   * @param event   The Event object.
   * @param args    The Event Data.
   */
  var rowAddFn = function (event, args)
  {
    this.addRow(args.rowData, null);
  };

  builder.subscribe(opencadcVOBuilder.events.onDataLoadComplete,
                    dataLoadCompleteFn.bind(this));

  builder.subscribe(opencadcVOBuilder.events.onPageAddStart,
                    pageAddStartFn.bind(this));

  builder.subscribe(opencadcVOBuilder.events.onPageAddEnd,
                    function (e, args)
                    {
                      args.dataView.endUpdate();

                      // Sorting as data
                      // loads.  Not sure
                      // if this is a good
                      // idea or not.
                      // jenkinsd
                      // 2014.05.09 WebRT
                      // 53730
                      //sort();
                    });

  builder.subscribe(opencadcVOBuilder.events.onRowAdd,
                    rowAddFn.bind(this));

  builder.build();
};

Viewer.prototype.getRowCountMessage = function (totalRows, rowCount)
{
  return this.rowCountMessage(totalRows, rowCount);
};

Viewer.prototype.getTargetNodeSelector = function ()
{
  return this.targetNodeSelector;
};

Viewer.prototype.toggleEmptyResultsMessage = function (_show)
{
  if (_show)
  {
    this._$emptyResultsMessage.show();
  }
  else
  {
    this._$emptyResultsMessage.hide();
  }
};

Viewer.prototype.getHeader = function ()
{
  return $(this.targetNodeSelector).prev();
};

Viewer.prototype.getHeaderLabel = function ()
{
  return this.getHeader().find('.grid-header-label');
};

Viewer.prototype.getColumnManager = function ()
{
  return (this.options.columnManager || {});
};

Viewer.prototype.isRowDisabled = function (row)
{
  var rm = this.getRowManager();
  return rm.isRowDisabled ? rm.isRowDisabled(row) : false;
};

Viewer.prototype.getRowManager = function ()
{
  return this.options.rowManager || {};
};

Viewer.prototype.getColumns = function ()
{
  return this.columns;
};

Viewer.prototype.getColumnOptions = function ()
{
  return this.options.columnOptions;
};

Viewer.prototype.setOptionsForColumn = function (columnID, _colOpts)
{
  this.columnOptions[columnID] = _colOpts;
};

Viewer.prototype.getOptionsForColumn = function (columnLabel)
{
  return this.getColumnOptions()[columnLabel]
    ? this.getColumnOptions()[columnLabel] : {};
};

Viewer.prototype.getResizedColumns = function ()
{
  return this.resizedColumns;
};

Viewer.prototype.getUpdatedColumnSelects = function ()
{
  return this.updatedColumnSelects;
};

Viewer.prototype.setUpdatedColumnSelects = function (_updatedSelects)
{
  this.updatedColumnSelects = _updatedSelects;
};

Viewer.prototype.isFilterable = function (column)
{
  var globallyFilterable = this.getColumnManager().filterable || false;
  var columnFilterable = column.filterable || globallyFilterable;

  return (columnFilterable === true);
};

/**
 * Obtain whether the global fitMax or per column fitMax option has been
 * set.
 *
 * @param columnID    The column ID to check.
 */
Viewer.prototype.isFitMax = function (columnID)
{
  var columnOptions = this.getOptionsForColumn(columnID);
  var fitMaxEnabled = (this.options.fitMax === true);

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

Viewer.prototype.getColumnFilters = function ()
{
  return this.columnFilters;
};

Viewer.prototype.setColumnFilter = function (columnID, filterValue)
{
  $(this.targetNodeSelector).find('input[id="' + columnID
                                  + '_filter"]').val(filterValue);
};

Viewer.prototype.columnFiltersEmpty = function ()
{
  var filters = this.getColumnFilters();
  for (var cf in filters)
  {
    if (filters.hasOwnProperty(cf))
    {
      var nextFilter = filters[cf];

      if (nextFilter && $.trim(nextFilter))
      {
        return false;
      }
    }
  }

  return true;
};

Viewer.prototype.getColumnFilterPluginName = function ()
{
  return this.options.columnFilterPluginName || 'default';
};

Viewer.prototype.clearColumnFilters = function ()
{
  this.columnFilters = {};
};

/**
 * Obtain a column from the Grid by its unique ID.
 * @param columnID    The Column ID.
 * @returns {Object} column definition.
 */
Viewer.prototype.getGridColumn = function (columnID)
{
  var existingColumnIndex = this.grid.getColumnIndex(columnID);

  return !isNaN(existingColumnIndex)
    ? this.grid.getColumns()[existingColumnIndex] : null;
};

/**
 * Obtain the index of the given column ID.  Return the index, or -1 if it
 * does not exist.
 *
 * @param columnID
 * @returns {number}
 */
Viewer.prototype.getColumnIndex = function (columnID)
{
  var cols = this.getColumns();
  for (var i = 0; i < cols.length; i++)
  {
    var nextCol = cols[i];

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
Viewer.prototype.getColumn = function (columnID)
{
  var columnIndex = this.getColumnIndex(columnID);

  return (columnIndex || (columnIndex === Number(0)))
    ? this.columns[columnIndex] : null;
};

Viewer.prototype.addColumn = function (columnObject)
{
  this.columns.push(columnObject);
};

Viewer.prototype.setColumns = function (cols)
{
  this.columns = cols.slice(0);
};

Viewer.prototype.clearColumns = function ()
{
  this.columns.length = 0;
};

/**
 * Add a VOTable Row.
 *
 * @param row       The cadc.vot.Row object.
 * @param rowIndex  The optional row index.
 */
Viewer.prototype.addRow = function (row, rowIndex)
{
  var cellArray = row.getCells();
  var dataRow = {};

  dataRow['id'] = row.getID();
  for (var ci = 0, cl = cellArray.length; ci < cl; ci++)
  {
    var cell = cellArray[ci];
    var cellFieldID = cell.getField().getID();
    dataRow[cellFieldID] = cell.getValue();
  }

  dataRow[_ROW_SELECT_DISABLED_KEY_] = this.isRowDisabled(row);

  // Add items directly to prevent unnecessary refreshes.
  if (rowIndex)
  {
    this.grid.getData().getItems()[rowIndex] = dataRow;
  }
  else
  {
    this.grid.getData().getItems().push(dataRow);
  }

  this.trigger(applicationEvents.onRowAdded, {'rowData': dataRow});
};

Viewer.prototype.clearRows = function ()
{
  var data = this.grid.getData();
  data.beginUpdate();
  data.getItems().length = 0;
  data.endUpdate();
};

Viewer.prototype.getDataView = function ()
{
  return this.grid.getData();
};

Viewer.prototype.getSelectedRows = function ()
{
  return this.getGrid().getSelectedRows();
};

Viewer.prototype.getRow = function (_index)
{
  return this.grid.getData().getItem(_index);
};

Viewer.prototype.getRows = function ()
{
  return this.grid.getData().getItems();
};

Viewer.prototype.getGrid = function ()
{
  return this.grid;
};

Viewer.prototype.refreshGrid = function ()
{
  var g = this.grid;
  g.updateRowCount();
  g.invalidateAllRows();
  g.resizeCanvas();
};

Viewer.prototype.getGridHeaderHeight = function ()
{
  return ($('.grid-header').height() +
          $('.slick-header').height() +
          $('.slick-headerrow').height());
};

/**
 * Call if supporting a variable viewport height, and there's a static
 * header that not part of the grid container.
 */
Viewer.prototype.setViewportOffset = function (offset)
{
  this.viewportOffset = (offset + this.getGridHeaderHeight());
};

Viewer.prototype.setViewportHeight = function ()
{
  if (this.options.variableViewportHeight === true)
  {
    $(this.targetNodeSelector).height($(window).height() - this.viewportOffset);
  }
};

/**
 * Tell the Grid to sort.  This exists mainly to set an initial sort column
 * on the Grid.
 */
Viewer.prototype.sort = function ()
{
  if (this.sortcol)
  {
    var isAscending = (this.isSortAscending || (this.isSortAscending == 1));
    this.grid.setSortColumn(this.sortcol, isAscending);

    this.trigger(applicationEvents.onSort, {
      sortCol: this.sortcol,
      grid: this.grid,
      isSortAscending: isAscending
    });
  }
};

/**
 * Set the sort column.  Here mainly for testing.
 *
 * @param sortColumnumn   The column ID to use.
 */
Viewer.prototype.setSortColumn = function (sortColumnumn)
{
  this.sortColumn = sortColumnumn;
};

Viewer.prototype.getOptions = function ()
{
  return this.options;
};

Viewer.prototype.setOptions = function (_optionsDef)
{
  this.options = _optionsDef;
};

Viewer.prototype.usePager = function ()
{
  return this.options.pager;
};

Viewer.prototype.getLongestValues = function ()
{
  return this.longestValues;
};

Viewer.prototype.getLongestValue = function (_columnID)
{
  return this.longestValues[_columnID];
};

Viewer.prototype.setLongestValues = function (_newLongestValues)
{
  this.longestValues = _newLongestValues;
};

/**
 * Get the columns that are to BE displayed.
 * @return {Array}    Array of Column objects.
 */
Viewer.prototype.getDisplayColumns = function ()
{
  if (!this.displayColumns || (this.displayColumns.length == 0))
  {
    this.setDisplayColumns(this.getDefaultColumns().slice(0));
  }
  return this.displayColumns;
};

/**
 * Get the columns that ARE CURRENTLY displayed.  Useful for saving for
 * future profile usage (i.e. restoring previous session).
 *
 * @return {Array}    Array of Column objects.
 */
Viewer.prototype.getDisplayedColumns = function ()
{
  return this.grid ? this.grid.getColumns() : [];
};

Viewer.prototype.setDisplayColumns = function (dispCols)
{
  this.displayColumns = dispCols;
};

Viewer.prototype.getDefaultColumns = function ()
{
  var cols = [];
  var opts = this.options;
  var currentColumns = this.columns;
  var defaultColumnIDs = opts.defaultColumnIDs;

  if (!defaultColumnIDs || (defaultColumnIDs.length == 0))
  {
    cols = currentColumns.slice(0);
  }
  else
  {
    for (var i = 0, dcii = defaultColumnIDs.length; i < dcii; i++)
    {
      var nextDefaultColumn = defaultColumnIDs[i];
      var colOpts = opts.columnOptions[nextDefaultColumn];
      var visible = colOpts ?
                    ((colOpts.visible !== undefined) ? colOpts.visible :
                     true) : true;
      if (!visible)
      {
        var msg = nextDefaultColumn +
                  ' should not be declared invisible and part of defaults.';
        console.error(msg);
        throw new Error(msg);
      }

      if (nextDefaultColumn)
      {
        for (var j = 0, cj = currentColumns.length; j < cj; j++)
        {
          if (currentColumns[j].id == nextDefaultColumn)
          {
            cols.push(currentColumns[j]);
          }
        }
      }
    }
  }

  return cols;
};

/**
 * Calculate the width of a column from its longest value.
 * @param _column     The column to calculate for.
 * @returns {number}  The integer width.
 */
Viewer.prototype.calculateColumnWidth = function (_column)
{
  var columnName = _column.name;
  var colOpts = this.getOptionsForColumn(_column.id);
  var minWidth = columnName.length;
  var longestCalculatedWidth = this.getLongestValue(_column.id);
  var textWidthToUse = (longestCalculatedWidth > minWidth)
    ? longestCalculatedWidth : minWidth;

  var lengthStr = '';
  var userColumnWidth = colOpts.width;

  for (var v = 0; v < textWidthToUse; v++)
  {
    lengthStr += '_';
  }

  this.$_lengthFinder.addClass(_column.name);
  this.$_lengthFinder.text(lengthStr);

  var width = (this.$_lengthFinder.width() + 1);
  var colWidth = (userColumnWidth || width);

  this.$_lengthFinder.removeClass(_column.name);
  this.$_lengthFinder.empty();

  // Adjust width for cell padding.
  return colWidth;
};

/**
 * Used for resetting the force fit column widths.
 */
Viewer.prototype.resetColumnWidths = function ()
{
  for (var i = 0; i < this.columns.length; i++)
  {
    var col = this.columns[i];
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

  var gridColumns = this.grid.getColumns();
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

  this.grid.setColumns(dupGridColumns);

  if (totalWidth > 0)
  {
    $(this.targetNodeSelector).css('width', (totalWidth + 15) + 'px');

    if (this.usePager())
    {
      $(_PAGER_NODE_SELECTOR_).css('width', (totalWidth + 15) + 'px');
    }

    $(_HEADER_NODE_SELECTOR_).css('width', (totalWidth + 15) + 'px');
  }

  this.refreshGrid();
};

Viewer.prototype.setColumnWidth = function (_columnDefinition)
{
  // Do not calculate with checkbox column.
  if ((_columnDefinition.id != _CHECKBOX_SELECTOR_COLUMN_ID_)
      && (this.isFitMax(_columnDefinition.id) || this.options.forceFitColumns))
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
Viewer.prototype.doFilter = function (_value, _columnID)
{
  if (_columnID)
  {
    var filter = $.trim(_value);
    this.setColumnFilter(_columnID, filter);
    this.columnFilters[_columnID] = filter;

    $(this.getGridColumn(_columnID)).data('pureFilterValue', filter);

    this.getDataView().refresh();

    this.trigger(applicationEvents.onFilterData, null);
  }
};

Viewer.prototype.setupHeader = function (checkboxSelector, args)
{
  $(args.node).empty();

  // Display the label for the checkbox column filter row.
  if (checkboxSelector
      && (args.column.id == checkboxSelector.getColumnDefinition().id))
  {
    $('<div class="filter-boxes-label" '
      +
      'title="Enter values into the boxes to further filter results.">Filter:</div>').appendTo(args.node);
  }
  // Do not display for the checkbox column.
  else if (this.isFilterable(args.column))
  {
    var datatype = args.column.datatype;
    var tooltipTitle;

    if (datatype.isNumeric())
    {
      tooltipTitle =
        'Number: 10 or >=10 or 10..20 for a range , ! to negate';
    }
    else
    {
      tooltipTitle = 'String: Substring match , ! to negate matches';
    }

    var $filterInput =
      $('<input type="text">')
        .data('columnId', args.column.id)
        .val(this.getColumnFilters()[args.column.id])
        .attr('title', tooltipTitle)
        .attr('id', args.column.id + '_filter')
        .addClass('form-control').addClass('cadcvotv-filter-input')
        .appendTo(args.node);

    // Story 1647
    //
    // Having a big if/else is really a bad idea, but I don't know how to
    // dynamically specify a plugin name.
    //
    // jenkinsd 2014.12.03
    //
    if (this.getColumnFilterPluginName() === 'suggest')
    {
      $filterInput.cadcVOTV_filter_suggest(this,
                                           this.options.suggest_maxRowCount);
    }
    else
    {
      $filterInput.cadcVOTV_filter_default(this);
    }
  }
  else
  {
    // Allow for overrides per column.
    $('<span class="empty"></span>').appendTo(args.node);
    $(args.node).css('height', '100%');
  }
};

Viewer.prototype.registerPlugin = function (plugin)
{
  this.plugins.unshift(plugin);
  plugin.init(this);
};

Viewer.prototype.unregisterPlugin = function (plugin)
{
  for (var i = this.plugins.length; i >= 0; i--)
  {
    if (this.plugins[i] === plugin)
    {
      if (this.plugins[i].destroy)
      {
        this.plugins[i].destroy();
      }
      this.plugins.splice(i, 1);
      break;
    }
  }
};

/**
 * Initialize this VOViewer.
 */
Viewer.prototype.init = function ()
{
  var colManager = this.getColumnManager();
  var forceFitMax = (colManager.forceFitColumns
                     && colManager.forceFitColumnMode
                     && (colManager.forceFitColumnMode === 'max'));
  var checkboxSelector;
  var enableSelection = !this.options.enableSelection
                        || (this.options.enableSelection === true);

  if ((typeof CADC !== 'undefined') && CADC.CheckboxSelectColumn)
  {
    checkboxSelector = new CADC.CheckboxSelectColumn({
      cssClass: 'slick-cell-checkboxsel',
      width: _CHECKBOX_SELECTOR_DEFAULT_WIDTH_,
      headerCssClass: 'slick-header-column-checkboxsel',
      headerCheckboxLabel: this.options.headerCheckboxLabel,
      enableOneClickDownload: this.options.enableOneClickDownload,
      oneClickDownloadURL: this.options.oneClickDownloadURL,
      oneClickDownloadTitle: this.options.oneClickDownloadTitle,

      // The ID of the column to pull the unique link from.
      oneClickDownloadURLColumnID: this.options.oneClickDownloadURLColumnID
    });
  }
  else if (Slick.CheckboxSelectColumn)
  {
    checkboxSelector = new Slick.CheckboxSelectColumn({
      cssClass: 'slick-cell-checkboxsel',
      width: _CHECKBOX_SELECTOR_DEFAULT_WIDTH_,
      headerCssClass: 'slick-header-column-checkboxsel'
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
      ? this.columns : this.getDisplayColumns();

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
      this.columns.splice(0, 0, checkboxColumn);
      this.getDisplayColumns().splice(0, 0, checkboxColumn);
    }
    else
    {
      this.columns[checkboxColumnIndex] = checkboxColumn;
      this.getDisplayColumns()[checkboxColumnIndex] = checkboxColumn;
    }
  }

  this.options.defaultFormatter = function (row, cell, value, columnDef)
  {
    var returnValue = (value == null) ? ''
      : value.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

    return '<span class="cellValue ' + columnDef.id
           + '" title="' + returnValue + '">' + returnValue + '</span>';
  };

  var dataView = new Slick.Data.DataView({inlineFilters: true});
  this.grid = new Slick.Grid(this.targetNodeSelector, dataView,
    this.getDisplayColumns(), this.options);
  var rowSelectionModel;

  if (checkboxSelector)
  {
    if ((typeof CADC !== 'undefined')
        && (typeof CADC.RowSelectionModel !== 'undefined'))
    {
      rowSelectionModel =
        new CADC.RowSelectionModel({
          selectActiveRow: this.options.selectActiveRow,
          selectClickedRow: this.options.selectClickedRow,
          propagateEvents: this.options.propagateEvents
        });
    }
    else if (Slick.RowSelectionModel)
    {
      rowSelectionModel =
        new Slick.RowSelectionModel({
          selectActiveRow: this.options.selectActiveRow
        });
    }
    else
    {
      rowSelectionModel = null;
    }

    if (rowSelectionModel)
    {
      this.grid.setSelectionModel(rowSelectionModel);
    }

    this.grid.registerPlugin(checkboxSelector);
  }
  else
  {
    rowSelectionModel = null;
  }

  if (this.usePager())
  {
    new Slick.Controls.Pager(dataView, this.grid, $(_PAGER_NODE_SELECTOR_));
  }
  else
  {
    dataView.onPagingInfoChanged.subscribe((function (e, args)
                                           {
                                             var dataView = args.dataView;

                                             this.dataLoadComplete(
                                               dataView.getLength(),
                                               dataView.getItems().length,
                                               this.getHeaderLabel());
                                           }).bind(this));
  }

  dataView.onRowCountChanged.subscribe((function (e, args)
                                       {
                                         this.trigger(applicationEvents.onRowsChanged,
                                                      args);
                                       }).bind(this));

  var columnPickerConfig = colManager.picker;

  if (columnPickerConfig)
  {
    var columnPicker;
    var pickerStyle = columnPickerConfig.style;

    if (pickerStyle == 'dialog')
    {
      columnPicker =
        new cadc.vot.picker.DialogColumnPicker(this.columns, this.grid,
          columnPickerConfig.options);

      if (forceFitMax)
      {
        cadc.vot.picker.events.onSort.subscribe(this.resetColumnWidths);
        cadc.vot.picker.events.onResetColumnOrder.subscribe(this.resetColumnWidths);
        cadc.vot.picker.events.onShowAllColumns.subscribe(this.resetColumnWidths);
        cadc.vot.picker.events.onSortAlphabetically.subscribe(this.resetColumnWidths);
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
                                                            this.trigger(applicationEvents.onColumnOrderReset, null);
                                                          });
    }
    else if (pickerStyle == 'header')
    {
      columnPicker = new Slick.Controls.ColumnPicker(this.columns, this.grid,
        this.options);
      if (forceFitMax)
      {
        columnPicker.onColumnAddOrRemove.subscribe(this.resetColumnWidths);
      }

      columnPicker.onResetColumnOrder.subscribe(function ()
                                                {
                                                  // Clear the hash.
                                                  parent.location.hash = '';
                                                  this.trigger(applicationEvents.onColumnOrderReset, null);
                                                });
    }
    else if (pickerStyle == 'tooltip')
    {
      columnPicker =
        new Slick.Controls.PanelTooltipColumnPicker(this.columns,
          this.grid,
          columnPickerConfig.panel,
          columnPickerConfig.tooltipOptions,
          columnPickerConfig.options);

      if (forceFitMax)
      {
        columnPicker.onSort.subscribe(this.resetColumnWidths);
        columnPicker.onResetColumnOrder.subscribe(this.resetColumnWidths);
        columnPicker.onShowAllColumns.subscribe(this.resetColumnWidths);
        columnPicker.onSortAlphabetically.subscribe(this.resetColumnWidths);
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
                                                  this.trigger(applicationEvents.onColumnOrderReset, null);
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
    var gridColumns = this.grid.getColumns();

    for (var c in gridColumns)
    {
      if (gridColumns.hasOwnProperty(c))
      {
        var nextCol = gridColumns[c];
        totalWidth += nextCol.width;
      }
    }

    $(this.targetNodeSelector).css('width', totalWidth + 'px');

    if (this.usePager())
    {
      $(_PAGER_NODE_SELECTOR_).css('width', totalWidth + 'px');
    }

    $(_HEADER_NODE_SELECTOR_).css('width', totalWidth + 'px');
    this.grid.resizeCanvas();
  }

  // move the filter panel defined in a hidden div into grid top panel
  $('#inlineFilterPanel').appendTo(this.grid.getTopPanel()).show();

  this.grid.onKeyDown.subscribe(function (e, args)
                                {
                                  // select all rows on ctrl-a
                                  if ((e.which != 65) || !e.ctrlKey)
                                  {
                                    return false;
                                  }

                                  var rows = [];
                                  for (var i = 0;
                                       i < args.grid.getDataLength();
                                       i++)
                                  {
                                    rows.push(i);
                                  }

                                  args.grid.setSelectedRows(rows);
                                  e.preventDefault();

                                  return true;
                                });

  /**
   * Tell the dataview to do the comparison.
   */
  var doGridSort = function (_grid)
  {
    if (this.sortColumn)
    {
      var sortColumnObj = this.getColumn(this.sortColumn);

      // In the odd chance that the sort column is not in the displayed
      // column list.
      if (sortColumnObj)
      {
        var isnumeric = sortColumnObj.datatype.isNumeric();
        sortColumnObj.comparer.setIsNumeric(isnumeric);
        sortColumnObj.comparer.setSortColumn(sortColumnObj);

        var data = _grid.getData();

        // using native sort with comparer
        // preferred method but can be very slow in IE
        // with huge datasets
        data.sort(sortColumnObj.comparer.compare, this.isSortAscending);
        data.refresh();
      }

      this.refreshGrid();
    }
  };

  /**
   * Handle the local sort events.  These events are fired for the initial
   * sort when the Grid is loaded, if any.
   *
   * WebRT 53730
   */
  this.subscribe(applicationEvents.onSort, function (eventData, args)
  {
    this.isSortAscending = args.isSortAscending;
    this.sortColumn = args.sortCol;

    doGridSort(args.grid);
  });

  /**
   * Handle the Grid sorts.
   */
  this.grid.onSort.subscribe(function (e, args)
                             {
                               this.isSortAscending = args.isSortAscending;
                               this.sortColumn = args.sortCol.field;

                               doGridSort(args.grid);
                             });

  if (this.getRowManager().onRowRendered)
  {
    this.grid.onRenderComplete.subscribe((function (e, args)
    {
      var renderedRange =
        args.grid.getRenderedRange();
      for (var i = renderedRange.top,
             ii = renderedRange.bottom;
           i <= ii; i++)
      {
        var $nextRow =
          args.grid.getData().getItem(i);
        this.getRowManager()
          .onRowRendered($nextRow, i);
      }
    }).bind(this));
  }

  dataView.onPagingInfoChanged.subscribe((function (e, pagingInfo)
  {
    var isLastPage =
      (pagingInfo.pageNum ==
       pagingInfo.totalPages - 1);
    var enableAddRow =
      (isLastPage ||
       pagingInfo.pageSize == 0);
    var options =
      this.grid.getOptions();
    if (options.enableAddRow !=
        enableAddRow)
    {
      this.grid.setOptions(
        {enableAddRow: enableAddRow});
    }
  }).bind(this));

  $(window).resize((function ()
  {
    this.setViewportHeight();
    this.grid.resizeCanvas();
    this.grid.invalidateAllRows();
    this.grid.render();
  }).bind(this));

  /**
   * Header row ready.
   *
   * @param e
   * @param args
   */
  var headerRowCellRenderedFn = function (e, args)
  {
    this.setupHeader(checkboxSelector, args);
  };

  this.grid.onHeaderRowCellRendered.subscribe(
    headerRowCellRenderedFn.bind(this));

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
                                                     'unitValue',
                                                     args.unitValue);
                                                 }

                                                 // track select changes.
                                                 this.updatedColumnSelects[args.column.id] =
                                                   args.unitValue;

                                                 // Invalidate to force
                                                 // column reformatting.
                                                 args.grid.invalidate();

                                                 this.trigger(applicationEvents.onUnitChanged,
                                                              args);
                                               });

    this.grid.registerPlugin(unitSelectionPlugin);
  }

  // VOTable viewer plugins.
  var enabledPlugins = this.getEnabledPlugins();

  for (var enabledPluginName in enabledPlugins)
  {
    // TODO - rework plugin lookup.
    this.registerPlugin(new cadc.vot.plugin[enabledPluginName](
      enabledPlugins[enabledPluginName]));
  }
  // End VOTable Viewer plugins.

  // Track the width of resized columns.
  this.grid.onColumnsResized.subscribe(function (e, args)
                                       {
                                         var columns = args.grid.getColumns();

                                         for (var i = 0, ci = columns.length;
                                              i < ci; i++)
                                         {
                                           var column = columns[i];

                                           if (column.width !==
                                               column.previousWidth)
                                           {
                                             this.getResizedColumns[column.id] =
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
 * @param {Metadata} _metadata        The Metadata instance.
 * @param {Object}   _longestValues   Mapping of column ID to longest value.
 * @param {boolean}  _refreshColumns  Whether to refresh the columns
 *   (true/false).
 */
Viewer.prototype.load = function (_metadata, _longestValues, _refreshColumns)
{
  if (!_metadata)
  {
    throw new Error('Metadata is empty.');
  }

  this.setLongestValues(_longestValues);

  if (_refreshColumns)
  {
    this.refreshColumns(_metadata.getFields());
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
Viewer.prototype.refreshColumns = function (_fields)
{
  this.clearColumns();
  var colManager = this.getColumnManager();

  for (var fi = 0, fl = _fields.length; fi < fl; fi++)
  {
    var field = _fields[fi];
    var fieldKey = field.getID();
    var colOpts = this.getOptionsForColumn(fieldKey);
    var cssClass = colOpts.cssClass;
    var datatype = field.getDatatype();
    var filterable = (colManager.filterable === true);

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
        resizable: colManager.resizable,
        sortable: colOpts.sortable ? colOpts.sortable : true,

        // VOTable attributes.
        unit: field.getUnit(),
        utype: field.getUType(),
        filterable: filterable,
        comparer: colOpts.comparer ? colOpts.comparer :
                  new opencadcVOComparer.Comparer()
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
    else if (colManager.forceFitColumns || this.isFitMax(columnObject.id))
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
Viewer.prototype.formatCellValue = function (rowItem, grid, columnID)
{
  var columnIndex = grid.getColumnIndex(columnID);
  var column = grid.getColumns()[columnIndex];
  var cellValue = rowItem[column.field];
  var valueFormatter = column.valueFormatter;

  return valueFormatter(cellValue, column);
};

/**
 * Function for the search filter to run.  This is meant to be in the
 * context of the dataView, so don't forget to bind the function to 'this'.
 *
 * @param item      Filter item.
 * @param args      columnFilters - columnFilter object.
 *                  grid - grid object.
 *                  doFilter - filter method.
 * @returns {boolean}
 */
Viewer.prototype.searchFilter = function (item, args)
{
  var filters = args.columnFilters;
  var grid = args.grid;

  for (var colID in filters)
  {
    if (filters.hasOwnProperty(colID))
    {
      var filterValue = filters[colID];
      if ((colID !== undefined) && (filterValue !== ''))
      {
        var cellValue = args.formatCellValue(item, grid, colID);

        filterValue = $.trim(filterValue);
        var negate = (filterValue.indexOf('!') === 0);

        if (negate)
        {
          filterValue = filterValue.substring(1);
        }

        console.log('Filter value ' + filterValue + ' for ' + cellValue);

        // The args.doFilter method is in the Grid's DataView object.
        var filterOut = args.doFilter(filterValue, cellValue);

        console.log('Filtering? ' + filterOut);

        if ((!negate && filterOut) || (!filterOut && negate))
        {
          return false;
        }
      }
    }
  }

  return true;
};

Viewer.prototype.render = function ()
{
  var g = this.grid;
  var dataView = g.getData();
  var filter = new opencadcVOFilter.Filter();

  // initialize the model after all the events have been hooked up
  dataView.beginUpdate();
  dataView.setFilterArgs({
                           columnFilters: this.getColumnFilters(),
                           grid: g,
                           formatCellValue: this.formatCellValue,
                           doFilter: filter.valueFilters
                         });

  dataView.setFilter(this.searchFilter.bind(this));
  dataView.endUpdate();

  if (g.getSelectionModel())
  {
    // If you don't want the items that are not visible (due to being
    // filtered out or being on a different page) to stay selected, pass
    // 'false' to the second arg
    dataView.syncGridSelection(g, true);
  }

  var gridContainer = $(this.targetNodeSelector);

  if (gridContainer.resizable && this.options.gridResizable)
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
Viewer.prototype.trigger = function (_event, _args)
{
  var args = _args || {};
  args.application = this;

  return $(this).trigger(_event, args);
};

/**
 * Subscribe to one of this form's events.
 *
 * @param _event      Event object.
 * @param __handler   Handler function.
 */
Viewer.prototype.subscribe = function (_event, __handler)
{
  $(this).off(_event.type).on(_event.type, __handler);
};

Viewer.prototype.unsubscribe = function (_event)
{
  $(this).off(_event.type);
};

/**
 * Remove event subscriptions and all that.
 */
Viewer.prototype.destroy = function ()
{
  if (this.grid)
  {
    this.clearRows();
    this.grid.destroy();
  }

  var i = this.plugins.length;
  while (i--)
  {
    this.unregisterPlugin(this.plugins[i]);
  }

  // Unsubscribe all events.
  $(this).off();
};

Viewer.prototype._defaultPageChanging = function (count1, count2, $label)
{
  $label.text(this.getRowCountMessage(count1, count2));
};

Viewer.prototype.getTotalRows = function ()
{
  return this.grid.getDataLength();
};

/**
 * Return an object containing all of the enabled plugins requested.
 *
 * @returns {{}}
 */
Viewer.prototype.getEnabledPlugins = function ()
{
  var enabledPlugins = {};
  var opts = this.options;

  if (opts.hasOwnProperty('plugins'))
  {
    var plugins = opts.plugins;
    for (var pluginName in plugins)
    {
      if (plugins.hasOwnProperty(pluginName))
      {
        var plugin = plugins[pluginName];

        if (plugin.hasOwnProperty('enabled') && (plugin.enabled === true))
        {
          enabledPlugins[pluginName] = plugin;
        }
      }
    }
  }

  return enabledPlugins;
};

Viewer.prototype.getCurrentRows = function ()
{
  return this.grid.getData().getItems().length;
};

Viewer.prototype.getDefaultColumnIDs = function ()
{
  return this.options.defaultColumnIDs;
};

module.exports.Viewer = Viewer;
module.exports.events = applicationEvents;
