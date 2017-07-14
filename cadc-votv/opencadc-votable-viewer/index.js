"use strict";

(function (window)
{
  require("slickgrid");
  require("jquery-csv");
  window.opencadcUtil = require("opencadc-util");
  window.xpath = require("xpath");
  window.opencadcFilterEngine = require("opencadc-votable-filter-engine");
  window.quickFilter = require("./opencadc.votable-viewer-quick-filter");
  window.opencadcVOTable = require("opencadc-votable");
  window.opencadcRowBuilder = require("opencadc-votable-row-builder");

  // Allow for further use.
  module.exports = require("./opencadc.votable-viewer");

  // Put into the window for use in <script> tags.
  window.opencadcViewer = module.exports;
})(window);
