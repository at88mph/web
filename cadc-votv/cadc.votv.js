;
(function ($, window, document, CADC, undefined) {
  'use strict'

  const _STATIC_ = {
    CHECKBOX_SELECTOR_COLUMN_ID: '_checkbox_selector',
    ROW_SELECT_DISABLED_KEY: '_ROW_SELECT_DISABLED_',
    datatype: {
      NUMERIC: 'NUMERIC',
      STRING: 'STRING',
      DATETIME: 'DATETIME'
    },
    DEFAULT_CELL_PADDING_PX: 8,
    events: {
      onSort: new $.Event('cadcVOTV:onSort'),
      onColumnOrderReset: new $.Event('cadcVOTV:onColumnOrderReset'),
      onRowsChanged: new $.Event('cadcVOTV:onRowsChanged'),
      onRowAdded: new $.Event('cadcVOTV:onRowAdded'),
      onDataLoaded: new $.Event('cadcVOTV:onDataLoaded'),
      onFilterData: new $.Event('cadcVOTV:onFilterData'),
      onUnitChanged: new $.Event('cadcVOTV:onUnitChanged')
    },
    filters: {
      '>': 'gt',
      '<': 'lt',
      '<=': 'le',
      '>=': 'ge',
      '..': 'range'
    }
  }

  const $_lengthFinder =
    $('#lengthFinder') ||
    $("<div id='lengthFinder'></div>").appendTo($(document.body))

  function escapeRegex(value) {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&")
  }

  function isNumber(val) {
    return !isNaN(parseFloat(val)) && (isFinite(val) || isFinite(parseFloat(val)))
  }

  function areNumbers() {
    for (let i = 0; i < arguments.length; i++) {
      if (!isNumber(arguments[i])) {
        return false
      }
    }
    return true
  }

  function areStrings() {
    for (let i = 0; i < arguments.length; i++) {
      if (!arguments[i].substring) {
        return false
      }
    }
    return true
  }

  /**
   * Format the value in the cell according to the current unit.
   *
   * @param rowItem       The current row.
   * @param grid          The Grid instance.
   * @param columnID      The ID of the column.
   * @returns {*}         Formatted value.
   */
  function formatCellValue(rowItem, grid, columnID) {
    const columnIndex = grid.getColumnIndex(columnID)
    const column = grid.getColumns()[columnIndex]
    const cellValue = rowItem[column.field]
    const valueFormatter = column.valueFormatter

    return valueFormatter(cellValue, column)
  }

  function defaultRowCountMessage(totalRows, rowCount) {
    return (
      'Showing ' + totalRows + ' rows (' + rowCount + ' before filtering).'
    )
  }

  function getPagerNodeSelector() {
    return '#pager'
  }

  function getHeaderNodeSelector() {
    return 'div.grid-header'
  }

  /**
   * Function for the search filter to run.  This is meant to be in the
   * context of the dataView, so 'this' will refer to the current instance of
   * the data view.
   *
   * @param {String|Number} item      Filter item.
   * @param {{}}  args      columnFilters - columnFilter object.
   *                        grid - grid object.
   *                        doFilter - filter method.
   * @returns {boolean}
   */
  function searchFilter(item, args) {
    const filters = args.columnFilters
    const grid = args.grid

    for (let columnId in filters) {
      if (filters.hasOwnProperty(columnId)) {
        const filterValue = filters[columnId]
        if (columnId !== undefined && filterValue !== '') {
          const cellValue = args.formatCellValue(item, grid, columnId)

          filterValue = $.trim(filterValue)
          const negate = filterValue.indexOf('!') === 0

          if (negate) {
            filterValue = filterValue.substring(1)
          }

          // The args.doFilter method is in the Grid's DataView object.
          const filterOut = args.doFilter(filterValue, cellValue)

          if ((!negate && filterOut) || (!filterOut && negate)) {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * Create a VOView object.  This is here to package everything together.
   *
   * @param {String}  targetNodeSelector  The target node selector to place the this.
   * @param {{}}  options             The options object.
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
  function Viewer(targetNodeSelector, options) {
    this.grid = null
    this.columnManager = options.columnManager ? options.columnManager : {}
    this.rowManager = options.rowManager ? options.rowManager : {}

    this.$emptyResultsMessage =
      $(options.emptyResultsMessageSelector) ||
      $(
        '<div class="cadcvotv-empty-results-message">No results returned.</div>'
      ).appendTo($('.grid-container'))

    this.columns = []

    // displayColumns: columns that are actually in the Grid.
    this.displayColumns = options.displayColumns ? options.displayColumns : []
    this.resizedColumns = {} // Columns the user has resized.
    this.columnFilters = options.columnFilters ? options.columnFilters : {}
    this.columnFilterPluginName = options.columnFilterPluginName || 'default'
    this.updatedColumnSelects = {}
    this.targetNodeSelector = targetNodeSelector
    this.columnOptions = options.columnOptions ? options.columnOptions : {}
    this.options = options || {}
    this.options.heightOffset = options.heightOffset ? options.heightOffset : 0
    this.options.forceFitColumns = options.columnManager ?
      options.columnManager.forceFitColumns :
      false
    this.options.asyncPostRenderDelay = options.asyncPostRenderDelay || 0

    // This is the TableData for a VOTable.  Will be set on load.
    this.longestValues = {}

    this.sortcol = options.sortColumn
    this.sortAsc = options.sortDir == 'asc'

    // story 1584 - variable viewport height
    this.variableViewportHeight = options.variableViewportHeight ?
      options.variableViewportHeight :
      false
    this.viewportOffset = 0

    this.rowCountMessage = options.rowCountMessage ?
      options.rowCountMessage :
      defaultRowCountMessage

    this.atDataLoadComplete = options.atDataLoadComplete ?
      options.atDataLoadComplete :
      this.defaultDataLoadComplete
    this.atPageInfoChanged = options.atPageInfoChanged ?
      options.atPageInfoChanged :
      this.defaultPageChanging
    this.plugins = []
  }

  /**
   * @param {{}}  input  Object representing the input.
   *
   * One of xmlDOM or json or url is required.
   *
   * input.xmlDOM = The XML DOM Object
   * input.json = The JSON Object
   * input.csv = The CSV text
   * input.url = The URL of the input.  The Content-Type will dictate how to
   *             build it.  This is the only way to stream CSV.
   * @param {function}  completeCallback  Callback function when complete.
   * @param {function}  errorCallBack     Callback function with jqXHR, status, message
   *                    (Conforms to jQuery error callback for $.ajax calls).
   */
  Viewer.prototype.build = function (input, completeCallback, errorCallBack) {
    // Keep the empty results stuff hidden.
    $(this.getTargetNodeSelector()).removeClass('cadcvotv-empty-results-overlay')
    this.$emptyResultsMessage.hide()

    new cadc.vot.Builder(
      this.getOptions().maxRowLimit,
      input,
      function (voTableBuilder) {
        voTableBuilder.subscribe(_STATIC_.events.onDataLoadComplete, function (
          event,
          args
        ) {
          if (args && args.longestValues) {
            this.setLongestValues(args.longestValues)
          }

          if (input.xmlDOM) {
            const voTable = args.builder.getVOTable()

            if (!hasDisplayColumns) {
              this.refreshColumns(voTable.getMetadata().getFields())
            }

            // Setup the Grid and DataView to be
            // loaded.
            this.init()

            this.load(args.builder.getVOTable(), false, true)
          }

          this.resetColumnWidths()

          // Display spinner only
          // if paging is off
          if (!usePager()) {
            this.atDataLoadComplete(
              this.getTotalRows(),
              this.getCurrentRows(),
              this.getHeaderLabel()
            )
          }

          const $gridHeaderIcon = this.getHeader().find('img.grid-header-icon')

          // clear the wait icon
          $gridHeaderIcon.attr('src', 'cadcVOTV/images/transparent-20.png')

          if (this.getRows().length === 0) {
            $(this.getTargetNodeSelector()).addClass(
              'cadcvotv-empty-results-overlay'
            )
            this.$emptyResultsMessage.show()
          }

          this.trigger(cadc.vot.events.onDataLoaded, args)
        }.bind(this))

        const hasDisplayColumns =
          this.displayColumns && this.displayColumns.length > 0

        // Set up to stream.
        if (input.url || input.csv) {
          const inputFields = input.tableMetadata.getFields()
          const $resultsGridHeader = this.getHeader()
          const $gridHeaderIcon = this.getHeader().find('img.grid-header-icon')

          // Display spinner only if paging is off
          if (!this.usePager()) {
            const $gridHeaderStyle = $resultsGridHeader.prop('style')

            // remove any background color resulting from
            // previous warning message
            if ($gridHeaderStyle) {
              $gridHeaderStyle.backgroundColor = ''
            }

            // add a spinner to the header bar to indicate
            // streaming has begun
            if ($gridHeaderIcon) {
              $gridHeaderIcon.attr(
                'src',
                'cadcVOTV/images/PleaseWait-small.gif'
              )
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
          if (!hasDisplayColumns) {
            this.refreshColumns(inputFields)
          }

          // Setup the Grid and DataView to be loaded.
          this.init()

          voTableBuilder.subscribe(cadc.vot.onPageAddStart, function () {
            this.getDataView().beginUpdate()

            // Notify that data is loading.
            this.atPageInfoChanged(
              this.getTotalRows(),
              this.getCurrentRows(),
              this.getHeaderLabel()
            )
          })

          voTableBuilder.subscribe(cadc.vot.onPageAddEnd, function () {
            this.getDataView().endUpdate()
          })

          voTableBuilder.subscribe(cadc.vot.onRowAdd, function (event, row) {
            this.addRow(row, null)
          })
        }

        voTableBuilder.build(voTableBuilder.buildRowData)

        if (completeCallback) {
          completeCallback(voTableBuilder)
        }
      },
      errorCallBack
    )
  }

  Viewer.prototype.getRowCountMessage = function (totalRows, rowCount) {
    return this.rowCountMessage(totalRows, rowCount)
  }

  Viewer.prototype.getTargetNodeSelector = function () {
    return this.targetNodeSelector
  }

  Viewer.prototype.getHeader = function () {
    return $(this.getTargetNodeSelector()).prev()
  }

  Viewer.prototype.getHeaderLabel = function () {
    return this.getHeader().find('.grid-header-label')
  }

  Viewer.prototype.getColumnManager = function () {
    return this.columnManager
  }

  Viewer.prototype.getRowManager = function () {
    return this.rowManager
  }

  Viewer.prototype.getColumns = function () {
    return this.columns
  }

  Viewer.prototype.setColumns = function (cols) {
    this.columns = cols.slice(0)
  }

  Viewer.prototype.getColumnOptions = function () {
    return this.columnOptions
  }

  Viewer.prototype.setOptionsForColumn = function (columnID, _colOpts) {
    this.columnOptions[columnID] = _colOpts
  }

  Viewer.prototype.getOptionsForColumn = function (columnLabel) {
    return this.getColumnOptions()[columnLabel] ?
      this.getColumnOptions()[columnLabel] : {}
  }

  Viewer.prototype.getResizedColumns = function () {
    return this.resizedColumns
  }

  Viewer.prototype.getUpdatedColumnSelects = function () {
    return this.updatedColumnSelects
  }

  Viewer.prototype.setUpdatedColumnSelects = function (_updatedSelects) {
    this.updatedColumnSelects = _updatedSelects
  }

  Viewer.prototype.isFilterable = function (column) {
    const globallyFilterable = this.getColumnManager().filterable || false
    const columnFilterable =
      (column.filterable === null && globallyFilterable) ||
      column.filterable === true

    return columnFilterable === true
  }

  /**
   * Obtain whether the global fitMax or per column fitMax option has been
   * set.
   *
   * @param columnID    The column ID to check.
   */
  Viewer.prototype.isFitMax = function (columnID) {
    const columnOptions = this.getOptionsForColumn(columnID)
    const fitMaxEnabled = this.getOptions().fitMax === true

    if (columnOptions) {
      if (columnOptions.fitMax === true) {
        fitMaxEnabled = true
      } else if (columnOptions.fitMax === false) {
        fitMaxEnabled = false
      }
    }

    return fitMaxEnabled
  }

  Viewer.prototype.getColumnFilters = function () {
    return this.columnFilters
  }

  Viewer.prototype.setColumnFilter = function (columnID, filterValue) {
    $(this.getTargetNodeSelector())
      .find("input[id='" + columnID + "_filter']")
      .val(filterValue)
  }

  Viewer.prototype.columnFiltersEmpty = function () {
    for (let cf in this.columnFilters) {
      if (this.columnFilters.hasOwnProperty(cf)) {
        const nextFilter = this.columnFilters[cf]

        if (nextFilter && $.trim(nextFilter)) {
          return false
        }
      }
    }

    return true
  }

  Viewer.prototype.getColumnFilterPluginName = function () {
    return this.columnFilterPluginName
  }

  Viewer.prototype.clearColumnFilters = function () {
    this.columnFilters = {}
  }

  /**
   * Obtain a column from the Grid by its unique ID.
   * @param {String}  columnID    The Column ID.
   * @returns {Object} column definition.
   */
  Viewer.prototype.getGridColumn = function (columnID) {
    const existingColumnIndex = this.getGrid().getColumnIndex(columnID)
    return isNaN(existingColumnIndex) ? null : this.getGrid().getColumns()[existingColumnIndex]
  }

  /**
   * Obtain the index of the given column ID.  Return the index, or -1 if it
   * does not exist.
   *
   * @param {String}  columnID
   * @returns {number}
   */
  Viewer.prototype.getColumnIndex = function (columnID) {
    const allCols = this.getColumns()

    for (let i = 0, acl = allCols.length; i < acl; i++) {
      const nextCol = allCols[i]
      if (nextCol.id === columnID) {
        return i
      }
    }

    return -1
  }

  /**
   * Obtain a column from the CADC VOTV column cache by its unique ID.
   * @param {String}  columnID    The Column ID.
   * @returns {Object} column definition.
   */
  Viewer.prototype.getColumn = function (columnID) {
    const columnIndex = this.getColumnIndex(columnID)
    return (columnIndex || columnIndex === Number(0)) ? this.getColumns()[columnIndex] : null
  }

  Viewer.prototype.addColumn = function (columnObject) {
    this.columns.push(columnObject)
  }

  Viewer.prototype.clearColumns = function () {
    this.columns.length = 0
  }

  /**
   * Add a VOTable Row.
   *
   * @param {Row} row       The Row object.
   * @param {int} rowIndex  The optional row index.
   */
  Viewer.prototype.addRow = function (row, rowIndex) {
    const cellArray = row.getCells()
    const dataRow = {}

    dataRow['id'] = row.getID()
    for (let ci = 0, cl = cellArray.length; ci < cl; ci++) {
      const cell = cellArray[ci]
      const cellFieldID = cell.getField().getID()
      dataRow[cellFieldID] = cell.getValue()
    }

    if (this.getRowManager().isRowDisabled) {
      dataRow[
        cadc.vot.ROW_SELECT_DISABLED_KEY
      ] = this.getRowManager().isRowDisabled(row)
    }

    // Add items directly to prevent unnecessary refreshes.
    if (rowIndex === null || isNaN(rowIndex)) {
      this.getDataView().addItem(dataRow)
    } else {
      this.getDataView().insertItem(rowIndex, dataRow)
    }

    this.trigger(cadc.vot.events.onRowAdded, {
      rowData: dataRow
    })
  }

  Viewer.prototype.clearRows = function () {
    const data = this.getDataView()
    data.beginUpdate()
    data.getItems().length = 0
    data.endUpdate()
  }

  Viewer.prototype.getDataView = function () {
    return this.getGrid().getData()
  }

  Viewer.prototype.getSelectedRows = function () {
    return this.getGrid().getSelectedRows()
  }

  Viewer.prototype.getRow = function (_index) {
    return this.getDataView().getItem(_index)
  }

  Viewer.prototype.getRows = function () {
    return this.getDataView().getItems()
  }

  Viewer.prototype.getFilteredRows = function () {
    return this.getDataView().getFilteredItems()
  }

  Viewer.prototype.getGrid = function () {
    return this.grid
  }

  Viewer.prototype.refreshGrid = function () {
    const g = this.getGrid()
    g.updateRowCount()
    g.invalidateAllRows()
    g.resizeCanvas()
  }

  Viewer.prototype.getGridHeaderHeight = function () {
    return (
      $('.grid-header').height() +
      $('.slick-header').height() +
      $('.slick-headerrow').height()
    )
  }

  /**
   * Call if supporting a variable viewport height, and there's a static
   * header that not part of the grid container.
   */
  Viewer.prototype.setViewportOffset = function (offset) {
    this.viewportOffset = offset + this.getGridHeaderHeight()
  }

  Viewer.prototype.setViewportHeight = function () {
    if (this.variableViewportHeight) {
      $(this.targetNodeSelector).height(
        $(window).height() - this.viewportOffset
      )
    }
  }

  /**
   * Tell the Grid to sort.  This exists mainly to set an initial sort column
   * on the Grid.
   */
  Viewer.prototype.sort = function () {
    if (this.sortcol) {
      const isAscending = this.sortAsc || this.sortAsc === 1
      this.getGrid().setSortColumn(this.sortcol, isAscending)

      trigger(cadc.vot.events.onSort, {
        sortCol: this.sortcol,
        sortAsc: isAscending
      })
    }
  }

  /**
   * Set the sort column.  Here mainly for testing.
   *
   * @param _sortColumn   The column ID to use.
   */
  Viewer.prototype.setSortColumn = function (_sortColumn) {
    this.sortcol = _sortColumn
  }

  Viewer.prototype.getOptions = function () {
    return this.options
  }

  Viewer.prototype.setOptions = function (_optionsDef) {
    this.options = _optionsDef || {}
  }

  Viewer.prototype.usePager = function () {
    return this.getOptions() && getOptions().pager
  }

  Viewer.prototype.getLongestValues = function () {
    return this.longestValues
  }

  Viewer.prototype.getLongestValue = function (_columnID) {
    return this.getLongestValues()[_columnID]
  }

  Viewer.prototype.setLongestValues = function (_longestValues) {
    this.longestValues = _longestValues
  }

  /**
   * Get the columns that are to BE displayed.
   * @return {Array}    Array of Column objects.
   */
  Viewer.prototype.getDisplayColumns = function () {
    if (!this.displayColumns || this.displayColumns.length === 0) {
      this.setDisplayColumns(this.getDefaultColumns().slice(0))
    }
    return this.displayColumns
  }

  /**
   * Get the columns that ARE CURRENTLY displayed.  Useful for saving for
   * future profile usage (i.e. restoring previous session).
   *
   * @return {Array}    Array of Column objects.
   */
  Viewer.prototype.getDisplayedColumns = function () {
    return this.getGrid() ? this.getGrid().getColumns() : []
  }

  Viewer.prototype.setDisplayColumns = function (dispCols) {
    this.displayColumns = dispCols
  }

  Viewer.prototype.getDefaultColumns = function () {
    const cols = []
    const opts = this.getOptions()
    const defaultColumnIDs = opts.defaultColumnIDs

    if (!defaultColumnIDs || defaultColumnIDs.length === 0) {
      cols.concat(this.getColumns().slice(0))
    } else {
      for (let i = 0, dcii = defaultColumnIDs.length; i < dcii; i++) {
        const nextDefaultColumn = defaultColumnIDs[i]
        const colOpts = opts.columnOptions[nextDefaultColumn]
        const visible = colOpts ?
          colOpts.visible !== undefined ? colOpts.visible : true :
          true
        if (!visible) {
          const msg =
            nextDefaultColumn +
            ' should not be declared invisible and part of defaults.'
          console.error(msg)
          throw new Error(msg)
        }

        if (nextDefaultColumn) {
          const thisCols = this.getColumns()
          for (let j = 0, cj = thisCols.length; j < cj; j++) {
            if (thisCols[j].id == nextDefaultColumn) {
              cols.push(thisCols[j])
            }
          }
        }
      }
    }

    return cols
  }

  /**
   * Calculate whether the given value should be filtered out (omitted) from a result set based on the given filter
   * value.
   *
   * @param {String|Number} filter             The filter value as entered by the user.
   * @param {String|Number} value              The value to be filtered or not
   * @returns {Boolean} true if value is filtered-out by filter.
   */
  Viewer.prototype.valueFilters = function (filter, value) {
    filter = $.trim(filter)
    const dotIndex = filter.indexOf('..')

    if (dotIndex > 0) {
      // filter on the range and return
      const left = filter.substring(0, dotIndex)
      if (dotIndex + 2 < filter.length) {
        const right = filter.substring(dotIndex + 2)

        if (areNumbers(value, left, right)) {
          return (
            parseFloat(value) < parseFloat(left) ||
            parseFloat(value) > parseFloat(right)
          )
        } else {
          return value < left || value > right
        }
      }
    } else {
      const filterRegexStartsWith = /^\s?(>=|<=|=|>|<)?\s?(.*)/
      const matches = filterRegexStartsWith.exec(filter)
      const match = matches !== null && matches.length > 1 ? $.trim(matches[1]) : null
      const operator = match === null ? '' : _STATIC_.filters[match]

      if (operator) {
        filter = filter.substring(match.length)
      }

      const exactMatch = match === '='

      // act on the operator and value
      value = $.trim(value)

      const isFilterNumber = isNumber(filter)

      // Special case for those number filter expectations where the data is
      // absent.
      if (
        isFilterNumber &&
        (value === '' || value === 'NaN' || value === Number.NaN)
      ) {
        return true
      } else if (operator && !filter) {
        return false
      } else if (operator === 'gt') {
        // greater than operator
        if (areNumbers(value, filter)) {
          return parseFloat(value) <= parseFloat(filter)
        } else if (areStrings(value, filter)) {
          return value.toUpperCase() <= filter.toUpperCase()
        } else {
          return value <= filter
        }
      } else if (operator == 'lt') {
        // less-than operator
        if (areNumbers(value, filter)) {
          return parseFloat(value) >= parseFloat(filter)
        } else if (areStrings(value, filter)) {
          return value.toUpperCase() >= filter.toUpperCase()
        } else {
          return value >= filter
        }
      } else if (operator == 'ge') {
        // greater-than or equals operator
        if (areNumbers(value, filter)) {
          return parseFloat(value) < parseFloat(filter)
        } else if (areStrings(value, filter)) {
          return value.toUpperCase() < filter.toUpperCase()
        } else {
          return value < filter
        }
      } else if (operator == 'le') {
        // less-than or equals operator
        if (areNumbers(value, filter)) {
          return parseFloat(value) > parseFloat(filter)
        } else if (areStrings(value, filter)) {
          return value.toUpperCase() > filter.toUpperCase()
        } else {
          return value > filter
        }
      } else if (exactMatch === true) {
        return (
          value.toString().toUpperCase() !== filter.toString().toUpperCase()
        )
      } else {
        filter = escapeRegex(filter)

        const regex = new RegExp(filter, 'gi')
        const result = value.match(regex)

        return !result || result.length == 0
      }
    }
  }

  /**
   * Calculate the width of a column from its longest value.
   * @param {{}}  _column     The column to calculate for.
   * @returns {number}  The integer width.
   */
  Viewer.prototype.calculateColumnWidth = function (_column) {
    const columnName = _column.name
    const colOpts = this.getOptionsForColumn(_column.id)
    const minWidth = columnName.length
    const longestCalculatedWidth = this.getLongestValue(_column.id)
    const textWidthToUse = longestCalculatedWidth > minWidth ? longestCalculatedWidth : minWidth

    const lengthStr = ''
    const userColumnWidth = colOpts.width

    for (let v = 0; v < textWidthToUse; v++) {
      lengthStr += '_'
    }

    $_lengthFinder.addClass(_column.name)
    $_lengthFinder.text(lengthStr)

    const width = $_lengthFinder.width() + 1
    const colWidth = userColumnWidth || width

    $_lengthFinder.removeClass(_column.name)
    $_lengthFinder.empty()

    // Adjust width for cell padding.
    return colWidth + cadc.vot.DEFAULT_CELL_PADDING_PX
  }

  /**
   * Used for resetting the force fit column widths.
   */
  Viewer.prototype.resetColumnWidths = function () {
    const allCols = this.getColumns()

    for (let i = 0, acl = allCols.length; i < acl; i++) {
      const col = allCols[i]
      const initialWidth = this.getOptionsForColumn(col.id).width

      if (initialWidth && initialWidth !== Number(0)) {
        col.width = initialWidth
      } else {
        this.setColumnWidth(col)
      }
    }

    const gridColumns = this.getGrid().getColumns()
    const dupGridColumns = []
    const totalWidth = 0

    // Handle the visible columns
    for (let j = 0, jl = gridColumns.length; j < jl; j++) {
      const gridColumn = gridColumns[j]
      const existingColumn = this.getColumn(gridColumn.id)

      // Update the equivalent in the grid, if it's there.
      if (existingColumn) {
        gridColumn.width = existingColumn.width
      }

      totalWidth += gridColumn.width

      dupGridColumns.push(gridColumn)
    }

    this.getGrid().setColumns(dupGridColumns)

    if (totalWidth > 0) {
      $(this.getTargetNodeSelector()).css('width', totalWidth + 15 + 'px')

      if (this.usePager()) {
        $(this.getPagerNodeSelector()).css('width', totalWidth + 15 + 'px')
      }

      $(this.getHeaderNodeSelector()).css('width', totalWidth + 15 + 'px')
    }

    this.refreshGrid()
  }

  Viewer.prototype.setColumnWidth = function (_columnDefinition) {
    // Do not calculate with checkbox column.
    if (
      _columnDefinition.id != cadc.vot.CHECKBOX_SELECTOR_COLUMN_ID &&
      (this.isFitMax(_columnDefinition.id) || this.getOptions().forceFitColumns)
    ) {
      _columnDefinition.width = this.calculateColumnWidth(_columnDefinition)
    }
  }

  /**
   * Perform the filter of data.  This is typically called from the input
   * field, but is useful as a test function here.
   *
   * @param _value      The input value.
   * @param _columnID   The Column ID to tie to.
   */
  Viewer.prototype.doFilter = function (_value, _columnID) {
    if (_columnID) {
      const filter = $.trim(_value)
      this.setColumnFilter(_columnID, filter)
      this.getColumnFilters()[_columnID] = filter

      $(this.getGridColumn(_columnID)).data('pureFilterValue', filter)

      this.getDataView().refresh()

      this.trigger(cadc.vot.events.onFilterData, null)
    }
  }

  Viewer.prototype.setupHeader = function (checkboxSelector, args) {
    $(args.node).empty()

    // Display the label for the checkbox column filter row.
    if (
      checkboxSelector &&
      args.column.id === checkboxSelector.getColumnDefinition().id
    ) {
      $(
        "<div class='filter-boxes-label' " +
        "title='Enter values into the boxes to further filter results.'>Filter:</div>"
      ).appendTo(args.node)
    } else if (this.isFilterable(args.column)) {
      // Do not display for the checkbox column.
      const datatype = args.column.datatype
      const tooltipTitle = datatype.isNumeric() ?
        'Number: 10 or >=10 or 10..20 for a range , ! to negate' :
        'String: Substring match , ! to negate matches'

      const $filterInput = $("<input type='text'>")
        .data('columnId', args.column.id)
        .val(getColumnFilters()[args.column.id])
        .attr('title', tooltipTitle)
        .attr('id', args.column.id + '_filter')
        .addClass('cadcvotv-filter-input')
        .appendTo(args.node)

      // Story 1647
      //
      // Having a big if/else is really a bad idea, but I don't know how to
      // dynamically specify a plugin name.
      //
      // jenkinsd 2014.12.03
      //
      if (this.getColumnFilterPluginName() === 'suggest') {
        $filterInput.cadcVOTV_filter_suggest(
          this,
          this.getOptions().suggest_maxRowCount
        )
      } else {
        $filterInput.cadcVOTV_filter_default(this)
      }
    } else {
      // Allow for overrides per column.
      $('<span class="empty"></span>').appendTo(args.node)
      $(args.node).css('height', '100%')
    }
  }

  Viewer.prototype.registerPlugin = function (plugin) {
    this.plugins.unshift(plugin)
    plugin.init(this)
  }

  Viewer.prototype.unregisterPlugin = function (plugin) {
    for (let i = this.plugins.length; i >= 0; i--) {
      if (this.plugins[i] === plugin) {
        if (this.plugins[i].destroy) {
          this.plugins[i].destroy()
        }

        this.plugins.splice(i, 1)
        break
      }
    }
  }

  /**
   * Initialize this VOViewer.
   */
  Viewer.prototype.init = function () {
    const thisOpts = this.getOptions()
    const thisColumnManager = this.getColumnManager()
    const forceFitMax =
      thisColumnManager.forceFitColumns &&
      thisColumnManager.forceFitColumnMode &&
      thisColumnManager.forceFitColumnMode == 'max'
    let checkboxSelector
    const enableSelection = !thisOpts.enableSelection || thisOpts.enableSelection == true

    if (CADC.hasOwnProperty('CheckboxSelectColumn')) {
      checkboxSelector = new CADC.CheckboxSelectColumn({
        cssClass: 'slick-cell-checkboxsel',
        width: thisOpts.headerCheckboxWidth,
        headerCssClass: 'slick-header-column-checkboxsel',
        headerCheckboxLabel: thisOpts.headerCheckboxLabel,
        enableOneClickDownload: thisOpts.enableOneClickDownload,
        oneClickDownloadURL: thisOpts.oneClickDownloadURL,
        oneClickDownloadTitle: thisOpts.oneClickDownloadTitle,

        // The ID of the column to pull the unique link from.
        oneClickDownloadURLColumnID: thisOpts.oneClickDownloadURLColumnID,
        oneClickInvisibleDefault: thisOpts.oneClickInvisibleDefault
      })
    } else if (Slick.hasOwnProperty('CheckboxSelectColumn')) {
      checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: 'slick-cell-checkboxsel',
        width: 55,
        headerCssClass: 'slick-header-column-checkboxsel'
      })
    } else {
      checkboxSelector = null
    }

    if (checkboxSelector && enableSelection) {
      const checkboxColumn = checkboxSelector.getColumnDefinition()
      const colsToCheck =
        this.getDisplayColumns().length == 0 ? this.getColumns() : this.getDisplayColumns()

      const checkboxColumnIndex = -1

      $.each(colsToCheck, function (index, val) {
        if (checkboxColumn.id == val.id) {
          checkboxColumnIndex = index
        }
      })

      if (checkboxColumnIndex < 0) {
        this.getColumns().splice(0, 0, checkboxColumn)
        this.getDisplayColumns().splice(0, 0, checkboxColumn)
      } else {
        this.getColumns()[checkboxColumnIndex] = checkboxColumn
        this.getDisplayColumns()[checkboxColumnIndex] = checkboxColumn
      }
    }

    thisOpts.defaultFormatter = function (
      row,
      cell,
      value,
      columnDef,
      dataContext
    ) {
      let returnValue

      if (value == null) {
        returnValue = ''
      } else {
        returnValue = value
          .toString()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      }

      return (
        "<span class='cellValue " +
        columnDef.id +
        "' title='" +
        returnValue +
        "'>" +
        returnValue +
        '</span>'
      )
    }

    const dataView = new SlickDataView({
      inlineFilters: true
    })

    this.grid = new Slick.Grid(
      this.getTargetNodeSelector(),
      dataView,
      this.getDisplayColumns(),
      thisOpts
    )
    let rowSelectionModel

    if (checkboxSelector) {
      if (
        typeof CADC !== 'undefined' &&
        typeof CADC.RowSelectionModel !== 'undefined'
      ) {
        rowSelectionModel = new CADC.RowSelectionModel({
          selectActiveRow: thisOpts.selectActiveRow,
          selectClickedRow: thisOpts.selectClickedRow,
          propagateEvents: thisOpts.propagateEvents
        })
      } else if (Slick.RowSelectionModel) {
        rowSelectionModel = new Slick.RowSelectionModel({
          selectActiveRow: thisOpts.selectActiveRow
        })
      } else {
        rowSelectionModel = null
      }

      if (rowSelectionModel) {
        this.grid.setSelectionModel(rowSelectionModel)
      }

      this.grid.registerPlugin(checkboxSelector)
    } else {
      rowSelectionModel = null
    }

    if (this.usePager()) {
      new Slick.Controls.Pager(
        dataView,
        this.grid,
        $(this.getPagerNodeSelector())
      )
    } else {
      dataView.onPagingInfoChanged.subscribe(function () {
        this.atDataLoadComplete(
          this.getTotalRows(),
          this.getCurrentRows(),
          this.getHeaderLabel()
        )
      })
    }

    dataView.onRowCountChanged.subscribe(function (e, args) {
      this.trigger(cadc.vot.events.onRowsChanged, args)
    }.bind(this))

    const columnPickerConfig = thisColumnManager.picker

    if (columnPickerConfig) {
      let columnPicker
      const pickerStyle = columnPickerConfig.style

      if (pickerStyle === 'dialog') {
        columnPicker = new cadc.vot.picker.DialogColumnPicker(
          this.getColumns(),
          this.grid,
          columnPickerConfig.options
        )

        if (forceFitMax) {
          cadc.vot.picker.events.onSort.subscribe(resetColumnWidths)
          cadc.vot.picker.events.onResetColumnOrder.subscribe(
            resetColumnWidths
          )
          cadc.vot.picker.events.onShowAllColumns.subscribe(resetColumnWidths)
          cadc.vot.picker.events.onSortAlphabetically.subscribe(
            resetColumnWidths
          )
        }

        cadc.vot.picker.events.onColumnAddOrRemove.subscribe(function () {
          if (rowSelectionModel) {
            // Refresh.
            rowSelectionModel.refreshSelectedRanges()
          }
        })

        cadc.vot.picker.events.onResetColumnOrder.subscribe(function () {
          // Clear the
          // hash.
          parent.location.hash = ''
          this.trigger(cadc.vot.events.onColumnOrderReset, null)
        }.bind(this))
      } else if (pickerStyle === 'header') {
        columnPicker = new Slick.Controls.ColumnPicker(
          this.getColumns(),
          this.grid,
          thisOpts
        )
        if (forceFitMax) {
          columnPicker.onColumnAddOrRemove.subscribe(resetColumnWidths)
        }

        columnPicker.onResetColumnOrder.subscribe(function () {
          // Clear the hash.
          parent.location.hash = ''
          this.trigger(cadc.vot.events.onColumnOrderReset, null)
        }.bind(this))
      } else if (pickerStyle === 'tooltip') {
        columnPicker = new Slick.Controls.PanelTooltipColumnPicker(
          this.getColumns(),
          this.grid,
          columnPickerConfig.panel,
          columnPickerConfig.tooltipOptions,
          columnPickerConfig.options
        )

        if (forceFitMax) {
          columnPicker.onSort.subscribe(resetColumnWidths)
          columnPicker.onResetColumnOrder.subscribe(resetColumnWidths)
          columnPicker.onShowAllColumns.subscribe(resetColumnWidths)
          columnPicker.onSortAlphabetically.subscribe(resetColumnWidths)
        }

        columnPicker.onColumnAddOrRemove.subscribe(function () {
          if (rowSelectionModel) {
            // Refresh.
            rowSelectionModel.refreshSelectedRanges()
          }
        })

        columnPicker.onResetColumnOrder.subscribe(function () {
          // Clear the hash.
          parent.location.hash = ''
          this.trigger(cadc.vot.events.onColumnOrderReset, null)
        }.bind(this))
      } else {
        columnPicker = null
      }
    }

    if (forceFitMax) {
      const totalWidth = 0
      const gridColumns = this.grid.getColumns()

      for (let ci = 0, cl = gridColumns.length; ci < cl; ci++) {
        const nextCol = gridColumns[ci]
        totalWidth += nextCol.width
      }

      $(this.getTargetNodeSelector()).css('width', totalWidth + 'px')

      if (this.usePager()) {
        $(this.getPagerNodeSelector()).css('width', totalWidth + 'px')
      }

      $(this.getHeaderNodeSelector()).css('width', totalWidth + 'px')
      this.grid.resizeCanvas()
    }

    // move the filter panel defined in a hidden div into grid top panel
    $('#inlineFilterPanel')
      .appendTo(this.grid.getTopPanel())
      .show()

    this.grid.onKeyDown.subscribe(function (e) {
      // select all rows on ctrl-a
      if (e.which !== 65 || !e.ctrlKey) {
        return false
      } else {
        const rows = []
        for (let i = 0, gdl = this.grid.getDataLength(); i < gdl; i++) {
          rows.push(i)
        }

        this.grid.setSelectedRows(rows)
        e.preventDefault()

        return true
      }
    }.bind(this))

    /**
     * Tell the dataview to do the comparison.
     */
    const doGridSort = function () {
      if (this.sortcol) {
        const sortColumn = this.getColumn(this.sortcol)

        // In the odd chance that the sort column is not in the displayed
        // column list.
        if (sortColumn) {
          const isnumeric = sortColumn.datatype.isNumeric()
          sortColumn.comparer.setIsNumeric(isnumeric)
          sortColumn.comparer.setSortColumn(this.sortcol)

          const data = this.getGrid().getData()

          // using native sort with comparer
          // preferred method but can be very slow in IE
          // with huge datasets
          data.sort(sortColumn.comparer.compare, this.sortAsc)
          data.refresh()
        }

        this.refreshGrid()
      }
    }

    /**
     * Handle the local sort events.  These events are fired for the initial
     * sort when the Grid is loaded, if any.
     *
     * WebRT 53730
     */
    this.subscribe(cadc.vot.events.onSort, function (eventData, args) {
      this.sortAsc = args.sortAsc
      this.sortcol = args.sortCol

      doGridSort()
    }.bind(this))

    /**
     * Handle the Grid sorts.
     */
    this.grid.onSort.subscribe(function (e, args) {
      this.sortAsc = args.sortAsc
      this.sortcol = args.sortCol.field

      doGridSort()
    }.bind(this))

    if (this.getRowManager().onRowRendered) {
      this.grid.onRenderComplete.subscribe(function (e, args) {
        const g = args.grid

        const renderedRange = g.getRenderedRange()
        for (
          const i = renderedRange.top, ii = renderedRange.bottom; i <= ii; i++
        ) {
          const $nextRow = g.getData().getItem(i)
          this.getRowManager().onRowRendered($nextRow, i)
        }
      }.bind(this))
    }

    dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
      this.grid.updatePagingStatusFromView(pagingInfo)
    }.bind(this))

    $(window).resize(function () {
      this.setViewportHeight()
      this.grid.resizeCanvas()
      this.grid.invalidateAllRows()
      this.grid.render()
    }.bind(this))

    this.grid.onHeaderRowCellRendered.subscribe(function (e, args) {
      this.setupHeader(checkboxSelector, args)
    }.bind(this))

    if (Slick.Plugins && Slick.Plugins.UnitSelection) {
      const unitSelectionPlugin = new Slick.Plugins.UnitSelection({})

      // Extend the filter row to include the pulldown menu.
      unitSelectionPlugin.onUnitChange.subscribe(function (e, args) {
        if (columnPicker.updateColumnData) {
          columnPicker.updateColumnData(
            args.column.id,
            'unitValue',
            args.unitValue
          )
        }

        // track select changes.
        this.updatedColumnSelects[args.column.id] = args.unitValue

        // Invalidate to force
        // column reformatting.
        this.grid.invalidate()

        this.trigger(cadc.vot.events.onUnitChanged, args)
      }.bind(this))

      this.grid.registerPlugin(unitSelectionPlugin)
    }

    // VOTable viewer plugins.
    const enabledPlugins = this.getEnabledPlugins()

    for (let enabledPluginName in enabledPlugins) {
      this.registerPlugin(
        new cadc.vot.plugin[enabledPluginName](
          enabledPlugins[enabledPluginName]
        )
      )
    }
    // End VOTable Viewer plugins.

    // Track the width of resized columns.
    this.grid.onColumnsResized.subscribe(function (e, args) {
      const columns = args.grid.getColumns()

      for (let i = 0, ci = columns.length; i < ci; i++) {
        const column = columns[i]

        if (column.width !== column.previousWidth) {
          getResizedColumns[column.id] = column.width
          return false
        }
      }
    })

    if (forceFitMax) {
      this.resetColumnWidths()
    }

    this.setViewportOffset(
      $('div.slick-header-columns').height() + thisOpts.heightOffset
    )
    this.setViewportHeight()
    this.grid.resizeCanvas()

    this.subscribe(cadc.vot.events.onDataLoaded, function () {
      this.sort()
    }.bind(this))
  }

  /**
   * Load a fresh copy into this this.  This assumes first time load.
   *
   * @param {VOTable} voTable         The built VOTable.
   * @param {Boolean} _refreshColumns  Whether to refresh the columns (true/false).
   * @param {Boolean} _refreshData     Whether to refresh the data (true/false).
   */
  Viewer.prototype.load = function (voTable, _refreshColumns, _refreshData) {
    // Use the first Table of the first Resource only.
    const resource = voTable.getResources()[0]

    if (!resource) {
      throw new Error('No resource available.')
    }

    const table = resource.getTables()[0]

    if (!table) {
      throw new Error('No table available.')
    }

    this.setLongestValues(table.getTableData().getLongestValues())

    if (_refreshColumns) {
      this.refreshColumns(table.getFields())
    }

    if (_refreshData) {
      this.refreshData(table)
    }
  }

  /**
   * Refresh this Viewer's columns.
   *
   * WARNING: This will clear ALL of the columns, including the checkbox
   * selector column.  Generally, this method will only be called to
   * initialize the columns from the init() method, or when first building
   * the viewer.
   *
   * @param {[]}  _fields   A Table in the VOTable.
   */
  Viewer.prototype.refreshColumns = function (_fields) {
    this.clearColumns()
    const columnManager = this.getColumnManager()

    for (let fi = 0, fl = _fields.length; fi < fl; fi++) {
      const field = _fields[fi]
      const fieldKey = field.getID()
      const colOpts = this.getOptionsForColumn(fieldKey)
      const cssClass = colOpts.cssClass
      const datatype = field.getDatatype()
      const filterable = columnManager.filterable === true

      if (colOpts) {
        if (colOpts.filterable === true) {
          filterable = true
        } else if (colOpts.filterable === false) {
          filterable = false
        }
      }

      // We're extending the column properties a little here.
      const columnObject = {
        id: fieldKey,
        name: field.getName(),
        field: fieldKey,
        formatter: colOpts.formatter,
        valueFormatter: colOpts.valueFormatter ||
          function (value) {
            return value
          },
        asyncPostRender: colOpts.asyncFormatter,
        cssClass: cssClass,
        description: field.getDescription(),
        resizable: this.getColumnManager().resizable,
        sortable: colOpts.sortable ? colOpts.sortable : true,

        // VOTable attributes.
        unit: field.getUnit(),
        utype: field.getUType(),
        filterable: filterable,
        comparer: colOpts.comparer ?
          colOpts.comparer : new cadc.vot.Comparer()
      }

      // Default is to be sortable.
      columnObject.sortable =
        colOpts.sortable !== null && colOpts.sortable !== undefined ?
        colOpts.sortable :
        true

      if (datatype) {
        columnObject.datatype = datatype
      }

      columnObject.header = colOpts.header

      if (colOpts.width) {
        columnObject.width = colOpts.width
      } else if (columnManager.forceFitColumns || this.isFitMax(columnObject.id)) {
        columnObject.width = this.calculateColumnWidth(columnObject)
      }

      this.addColumn(columnObject)
    }
  }

  /**
   * Clean refresh of the data rows.
   *
   * @param {VOTable} table   A Table element from a VOTable.
   */
  Viewer.prototype.refreshData = function (table) {
    this.clearRows()

    // Make a copy of the array so as not to disturb the original.
    const allRows = table.getTableData().getRows()

    $.each(allRows, function (rowIndex, row) {
      this.addRow(row, rowIndex)
    })
  }

  Viewer.prototype.render = function () {
    const g = this.getGrid()
    const dataView = g.getData()

    // initialize the model after all the events have been hooked up
    dataView.beginUpdate()
    dataView.setFilterArgs({
      columnFilters: this.getColumnFilters(),
      grid: g,
      formatCellValue: formatCellValue,
      doFilter: valueFilters
    })

    dataView.setFilter(searchFilter)
    dataView.endUpdate()

    if (g.getSelectionModel()) {
      // If you don't want the items that are not visible (due to being
      // filtered out or being on a different page) to stay selected, pass
      // 'false' to the second arg
      dataView.syncGridSelection(g, true)
    }

    const gridContainer = $(this.getTargetNodeSelector())

    if (gridContainer.resizable && this.getOptions().gridResizable) {
      gridContainer.resizable()
    }

    g.init()
  }

  /**
   * Fire an event.  Taken from the slick.grid Object.
   *
   * @param {jQuery.Event}  _event       The Event to fire.
   * @param {{}}  _args        Arguments to the event.
   * @returns {*}       The event notification result.
   */
  Viewer.prototype.trigger = function (_event, _args) {
    const args = _args || {}
    args.application = this

    return $(this).trigger(_event, args)
  }

  /**
   * Subscribe to one of this form's events.
   *
   * @param _event      Event object.
   * @param __handler   Handler function.
   */
  Viewer.prototype.subscribe = function (_event, __handler) {
    $(this).on(_event.type, __handler)
  }

  Viewer.prototype.unsubscribe = function (_event) {
    $(this).off(_event.type)
  }

  /**
   * Remove event subscriptions and all that.
   */
  Viewer.prototype.destroy = function () {
    const g = this.getGrid()

    if (g) {
      this.clearRows()
      g.destroy()
    }

    const i = this.plugins.length
    while (i--) {
      this.unregisterPlugin(this.plugins[i])
    }

    // Unsubscribe all events.
    $(this).off()
  }

  Viewer.prototype.defaultDataLoadComplete = function () {
    const $gridHeaderLabel = this.getHeaderLabel()
    const message = this.getRowCountMessage(this.getTotalRows(), this.getCurrentRows())

    if (options.maxRowLimit <= this.getTotalRows()) {
      // and display warning message if maximum row limit is reached
      message += ' ' + options.maxRowLimitWarning
      this.getHeader().css('background-color', 'rgb(235, 235, 49)')
    }

    $gridHeaderLabel.text(message)
  }

  Viewer.prototype.defaultPageChanging = function (count1, count2, $label) {
    $label.text(this.getRowCountMessage(count1, count2))
  }

  Viewer.prototype.getTotalRows = function () {
    return this.getGrid().getDataLength()
  }

  /**
   * Return an object containing all of the enabled plugins requested.
   *
   * @returns {{}}
   */
  Viewer.prototype.getEnabledPlugins = function () {
    const enabledPlugins = {}
    const opts = this.getOptions()

    if (opts.hasOwnProperty('plugins')) {
      const plugins = opts.plugins
      for (let pluginName in plugins) {
        if (plugins.hasOwnProperty(pluginName)) {
          const plugin = plugins[pluginName]

          if (plugin.hasOwnProperty('enabled') && plugin.enabled === true) {
            enabledPlugins[pluginName] = plugin
          }
        }
      }
    }

    return enabledPlugins
  }

  Viewer.prototype.getCurrentRows = function () {
    return this.getGrid()
      .getData()
      .getItems().length
  }

  Viewer.prototype.getDefaultColumnIDs = function () {
    return this.getOptions().defaultColumnIDs
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Viewer
  }
})(jQuery, window, document, (typeof CADC === 'undefined' ? {} : CADC))
