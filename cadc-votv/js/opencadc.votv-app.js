'use strict';


var opencadcVOTableReader = require('../js/cadc.votable-reader');
var opencadcViewer = require('./opencadc.votv-viewer');

function VOTV(_targetNodeSelector, _input, _noAutoInit)
{
  var builderFactory = new opencadcVOTableReader.BuilderFactory();
  var builder = builderFactory.createBuilder(_input);

  this.viewer = new opencadcViewer.Viewer(_targetNodeSelector, _input);

  /**
   *
   * @private
   */
  this._init = function()
  {
    // Uninitialized.
    if (builder == null)
    {
      throw new Error("Builder not properly created.");
    }
    else
    {
      this.viewer = builder.build();
    }
  };

  if (!_noAutoInit)
  {
    this._init();
  }
}
