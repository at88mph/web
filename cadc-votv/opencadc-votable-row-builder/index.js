(function()
{
  this.opencadcUtil = require("opencadc-util");
  this.opencadcVOTable = require("opencadc-votable");
  this.jQuery = require("jquery");
  this.xpath = require("xpath");

  this.jQuery.csv = require("jquery-csv");
  
  module.exports = require("./opencadc.votable-row-builder");
})();
