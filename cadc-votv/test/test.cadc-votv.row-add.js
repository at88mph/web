'use strict'

const {
  assert,
  expect
} = require('chai')

global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
global.DOMParser = require('xmldom').DOMParser

const jsdom = require('jsdom')
const {
  JSDOM
} = jsdom

const window = (new JSDOM('', {
  pretendToBeVisual: true
})).window

global.window = window
const jQuery = require('jquery/dist/jquery')
global.jQuery = jQuery
this.document = global.document = window.document

require('slickgrid/slick.core')
global.Slick = this.Slick = global.window.Slick

global.Slick.Data = {
  DataView: require('slickgrid/slick.dataview')
}

const Viewer = require('../cadc.votv')
global.StringUtil = require('opencadc-util').StringUtil
const { Field, Row, Cell } = require('../cadc.votable')

// Create a DOM to pass in.
const targetNode = global.document.createElement('div')
targetNode.setAttribute('id', 'myGrid')
global.document.body.appendChild(targetNode)

const Viewer = require('../cadc.votv')
global.StringUtil = require('opencadc-util').StringUtil
const {
  Field,
  Row,
  Cell
} = require('../cadc.votable')

describe('Add rows to Viewer.', function () {
  // Create the options for the Grid.
  const options = {
    editable: false,
    enableAddRow: false,
    showHeaderRow: true,
    enableCellNavigation: true,
    asyncEditorLoading: true,
    forceFitColumns: true,
    explicitInitialization: true,
    topPanelHeight: 45,
    headerRowHeight: 45,
    showTopPanel: false,
    sortColumn: 'FIELD1',
    sortDir: 'asc',
    columnOptions: {}
  }

  it('Add rows.', function () {
    const testSubject = new Viewer('#myGrid', options)
    testSubject.init()

    // Make fields
    const fieldCount = 5
    const fields = []

    for (let fci = 0; fci < fieldCount; fci++) {
      const label = 'FIELD' + fci
      fields.push(new Field(label, label, 'UCD' + fci, 'UTYPE' + fci, null, null, null, null, null, label))
    }

    // Make rows.
    const rowCount = 20
    const rows = []
    const rowCells = []

    for (let ri = 0; ri < rowCount; ri++) {
      // Make row cells
      for (let rci = 0; rci < fieldCount; rci++) {
        rowCells.push(new Cell('CELLVAL' + rci, fields[rci]))
      }

      rows.push(new Row('ROW' + ri, rowCells))
    }

    // Add rows to the Viewer.
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      // Test with no index.
      testSubject.addRow(rows[rowIndex], rowIndex)

      expect(testSubject.getRows().length, 'Wrong row count.').to.equal(rowIndex + 1)
    }
  })
})
