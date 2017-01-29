'use strict';

var assert = require('assert');
global.$ = require('jquery');
require('jquery-csv');

var opencadcVOTable = require('../js/opencadc.votable');
var opencadcVOViewer = require('../js/opencadc.votv-viewer');

describe('Add rows to Viewer.', function ()
{
  var options = {
    editable: false,
    enableAddRow: false,
    showHeaderRow: true,
    enableCellNavigation: true,
    asyncEditorLoading: true,
    forceFitColumns: false,
    explicitInitialization: true,
    topPanelHeight: 45,
    headerRowHeight: 45,
    showTopPanel: false,
    sortColumn: 'FIELD1',
    sortDir: 'asc'
  };

  $('<div id=\'TESTITEMVIEWER\'></div>').appendTo($(document.body));
  var testSubject = new opencadcVOViewer.Viewer('#TESTITEMVIEWER', options);

  testSubject.init();

    // Make fields
    var fieldCount = 5;
    var fields = [];

    for (var fci = 0; fci < fieldCount; fci++)
    {
      var label = 'FIELD' + fci;
      fields.push(new opencadcVOTable.Field(label, label, 'UCD' + fci, 'UTYPE' +
                                                                       fci,
        null, null, null, null, null, label));
    }

    // Make rows.
    var rowCount = 20;
    var rows = [];
    var rowCells = [];

    for (var ri = 0; ri < rowCount; ri++)
    {
      // Make row cells
      for (var rci = 0; rci < fieldCount; rci++)
      {
        rowCells.push(new opencadcVOTable.Cell('CELLVAL' + rci, fields[rci]));
      }

      rows.push(new opencadcVOTable.Row('ROW' + ri, rowCells));
    }

  it('Has rows to add.', function ()
  {
    assert.ok(rows.length > 0);
  });

  it('Create data and add rows.', function ()
  {
    // Add rows to the Viewer.
    for (var rowIndex = 0; rowIndex < rows.length; rowIndex++)
    {
      // Test with no index.
      testSubject.addRow(rows[rowIndex], null);

      assert.equal(testSubject.getRows().length, rowIndex + 1,
                   'Wrong row count.');
    }
  });
});
