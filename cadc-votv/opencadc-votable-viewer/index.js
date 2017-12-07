'use strict'
;(function(jQuery, window) {
  module.exports.Slick = require('slickgrid').Slick
  require('jquery-csv')

  window.opencadcUtil = require('opencadc-util')
  window.xpath = require('xpath')
  window.opencadcFilterEngine = require('opencadc-votable-filter-engine')
  window.quickFilter = require('./opencadc.votable-viewer-quick-filter')
  window.opencadcVOTable = require('opencadc-votable')
  window.opencadcRowBuilder = require('opencadc-votable-row-builder')

  // Allow for further use.
  window.opencadcViewer = require('./opencadc.votable-viewer')

  module.exports = window

  // Put into the window for use in <script> tags.
  // window.opencadcViewer = module.exports
})(jQuery, window)
