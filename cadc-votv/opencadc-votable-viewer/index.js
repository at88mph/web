/**
 * Main application entry for the VOTable Viewer.
 */
(function ()
{
  this.jQuery = require("jquery");
  this.opencadcJSUtil = require("opencadc-util");
  require("slickgrid");

  // The Slick package is put into the window by default.
  this.Slick = window.Slick;

  require("jquery-ui/ui/widget");
  require("jquery-ui/ui/safe-active-element");
  require("jquery-ui/ui/safe-blur");
  require("jquery-ui/ui/widgets/mouse");
  require("jquery-ui/ui/unique-id");
  require("jquery-ui/ui/keycode");
  require("jquery-ui/ui/widgets/menu");
  require("jquery-ui/ui/widgets/selectmenu");
  require("jquery-ui/ui/widgets/autocomplete");

  this.opencadcVOBuilder = require("opencadc-votable-row-builder");
  this.opencadcVOFilter = require("opencadc-votable-filter-engine");

  jQuery.fn.quickFilter = require("./opencadc.votable-viewer-quick-filter");

  require("./opencadc.votable-viewer-quick-filter");
  module.exports = require("./opencadc.votable-viewer");
})();
