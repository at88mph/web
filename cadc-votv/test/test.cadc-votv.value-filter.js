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

const {
  document
} = (new JSDOM()).window

const {
  window
} = (new JSDOM()).window

global.window = document
global.jQuery = require('jquery/dist/jquery')(window)
global.document = document

const Viewer = require('../cadc.votv')

// Create a DOM to pass in.
const targetNode = document.createElement('div')
targetNode.setAttribute('id', 'myGrid')
document.body.appendChild(targetNode)

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
  sortColumn: 'Job ID',
  sortDir: 'asc',
  columnOptions: {
    User: {
      cssClass: 'user_column'
    },
    'Started on': {
      cssClass: 'started_on_column'
    }
  }
}

describe('Substring value filtering.', function () {
  const viewer = new Viewer('#myGrid', options)
  const testVal = 'N'

  it('Numeric filter 30000 times.', function () {
    const start = new Date()
    const mockUserFilterValue = '< 3'
    for (let i = 0; i < 30000; i++) {
      viewer.valueFilters(
        mockUserFilterValue,
        Math.floor(Math.random() * 10 + 1)
      )
    }

    const end = new Date()

    console.log(
      'Took ' + (end.getTime() - start.getTime()) / 1000 + ' seconds.'
    )
  })

  it('String substring filter (null).', function () {
    expect(viewer.valueFilters(testVal, 'null'), 'Should not filter').to.equal(false)
  })

  it('String substring filter (Neverland).', function () {
    expect(viewer.valueFilters(testVal, 'Neverland'), 'Should not filter').to.equal(false)
  })

  it('String substring filter (pull).', function () {
    expect(viewer.valueFilters(testVal, 'pull'), 'Should filter').to.equal(true)
  })

  it('String substring filter (-45).', function () {
    expect(viewer.valueFilters(testVal, -45), 'Should filter').to.equal(true)
  })

  it('String substring filter (9).', function () {
    expect(viewer.valueFilters(testVal, 9), 'Should filter').to.equal(true)
  })

  it('String substring filter (Pension).', function () {
    expect(viewer.valueFilters(testVal, 'Pension'), 'Should not filter').to.equal(false)
  })

  it('String substring filter (abseNce).', function () {
    expect(viewer.valueFilters(testVal, 'abseNce'), 'Should not filter').to.equal(false)
  })
})

describe('Exact match filtering', function () {
  const viewer = new Viewer('#myGrid', options)
  const testVal = 'pull'

  it('String substring filter (null).', function () {
    expect(viewer.valueFilters(testVal, 'null'), 'Should filter').to.equal(true)
  })

  it('String substring filter (Neverland).', function () {
    expect(viewer.valueFilters(testVal, 'Neverland'), 'Should filter').to.equal(true)
  })

  it('String substring filter (pull).', function () {
    expect(viewer.valueFilters(testVal, 'pull'), 'Should not filter').to.equal(false)
  })

  it('String substring filter (-45).', function () {
    expect(viewer.valueFilters(testVal, -45), 'Should filter').to.equal(true)
  })

  it('String substring filter (9).', function () {
    expect(viewer.valueFilters(testVal, 9), 'Should filter').to.equal(true)
  })

  it('String substring filter (Pension).', function () {
    expect(viewer.valueFilters(testVal, 'Pension'), 'Should filter').to.equal(true)
  })

  it('String substring filter (abseNce).', function () {
    expect(viewer.valueFilters(testVal, 'abseNce'), 'Should filter').to.equal(true)
  })
})
