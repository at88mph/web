(function ($, A)
{
  if (typeof A === "undefined")
  {
    // Require AladinLite.
    throw new Error("AladinLite must be present.  (http://aladin.u-strasbg.fr/AladinLite/)");
  }

  // register namespace
  $.extend(true, window, {
    "cadc": {
      "vot": {
        "plugin": {
          "footprint": AladinLiteFootprintViewer
        }
      }
    }
  });


  /**
   * AladinLite footprint viewer.  This is incorporated as a Plugin to allow
   *
   * @constructor
   */
  function AladinLiteFootprintViewer(_inputs)
  {
    var POLYGON_SPLIT = "Polygon ICRS";
    var DEFAULT_FOV_DEGREES = 180;
    var DEFAULT_FOV_BUFFER = (500 / 100);

    var _defaults = {
      targetSelector: "#aladin-lite",
      toggleSwitchSelector: null,
      hidden: false,    // Always show by default.
      toggleClose: function ($toggleSelector)
      {
        $toggleSelector.html($toggleSelector.data("open"));
      },
      toggleOpen: function ($toggleSelector)
      {
        $toggleSelector.html($toggleSelector.data("close"));
      },
      aladin_options: {},  // Specific options for AladinLite.
      renderedRowsOnly: true,
      footprintFieldID: "footprint",
      raFieldID: "ra",
      decFieldID: "dec",
      fovFieldID: "fov",
      colour: "orange",
      navigateToSelected: true,
      maxRowCount: false,
      highlightColour: "yellow",
      /**
       * Perform further calculations on the FOV before setting it.  Useful
       * for further reducing it (e.g. from square degrees to degrees), or
       * buffering the field with some padding.
       *
       * @param {Number} fovValue
       * @return  {Number}
       */
      afterFOVCalculation: function (fovValue)
      {
        return fovValue * DEFAULT_FOV_BUFFER;
      },
      resizeCalculation: function ()
      {
      },
      onHover: true,
      onClick: false
    };

    // Start with opposite max values.
    this.fovBox = {
      raLeft: null,
      raRight: null,
      decTop: null,
      decBottom: null
    };

    /**
     * Slick Grid instance.
     * @type {Slick.Grid|Grid}
     */
    this.grid = null;

    /**
     * VOTable Viewer instance.
     * @type {cadc.vot.Viewer|Viewer}
     */
    this.viewer = null;

    this.handler = new Slick.EventHandler();

    var inputs = $.extend(true, {}, _defaults, _inputs);

    this.footprintFieldID = inputs.footprintFieldID;
    this.raFieldID = inputs.raFieldID;
    this.decFieldID = inputs.decFieldID;
    this.fovFieldID = inputs.fovFieldID;
    this.$target = $(inputs.targetSelector);

    //
    // Declare AladinLite
    //
    this.aladin = null;

    // footprint overlay, public data
    this.aladinOverlay = null;
    //
    // End declaration of AladinLite
    //

    // currently 'active' (hover/click) row
    //
    this.currentFootprint = null;

    // Start at this location.  Reset when re-rendering.
    this.defaultRA = null;
    this.defaultDec = null;

    this.fieldOfViewSetFlag = false;

    /**
     * Initialize with the Slick Grid instance.
     * @param _viewer{cadc.vot.Viewer}      The CADC VOTable Viewer instance.
     */
    this.init = function (_viewer)
    {
      this.destroy();

      if (inputs.hidden === true)
      {
        this.$target.hide();
      }

      if (inputs.toggleSwitchSelector !== null)
      {
        var $toggleSwitchSelector = $(inputs.toggleSwitchSelector);

        if ((inputs.hidden === true) && ($toggleSwitchSelector.data("open") !== null))
        {
          $toggleSwitchSelector.html($toggleSwitchSelector.data("open"));
        }

        $toggleSwitchSelector.on("click", function (e)
        {
          e.preventDefault();
          this.$target.toggle();
          this._toggleView();
          this._toggleViewButton();

          return false;
        }.bind(this));
      }

      this.viewer = _viewer;
      this.grid = _viewer.getGrid();
      this.aladin = A.aladin(inputs.targetSelector, inputs.aladin_options);
      this.aladinOverlay = A.graphicOverlay({color: inputs.colour, lineWidth: 3});
      this.aladin.addOverlay(this.aladinOverlay);
      this.currentFootprint = A.graphicOverlay({
                                                 name: "current",
                                                 color: inputs.highlightColour,
                                                 lineWidth: 5
                                               });
      this.aladin.addOverlay(this.currentFootprint);
      this.viewAladinButton = $("#slick-visualize");
      this.viewAladinStatus = $("#slick-visualize-status");
      this.rowCount = 0;

      if (inputs.fov !== null)
      {
        this.aladin.setFoV(inputs.fov);
      }

      if (this.grid.getData().getLength)
      {
        if (inputs.renderedRowsOnly === true)
        {
          this.handler.subscribe(this.grid.onRenderComplete, this._handleRenderComplete);
        }
        else
        {
          this.viewer.subscribe(cadc.vot.events.onRowAdded,
                                function (e, args)
                                {
                                  this._handleAddFootprint(e, args);

                                  if (inputs.maxRowCount)
                                  {
                                    if (this.rowCount === 0)
                                    {
                                      this._enableButton();
                                    }

                                    this.rowCount++;

                                    if ((this.rowCount > inputs.maxRowCount)
                                        && (this.viewAladinButton.hasClass("ui-disabled") === false))
                                    {
                                      this._disableButton();
                                    }
                                  }
                                }.bind(this));

          this.viewer.subscribe(cadc.vot.events.onDataLoaded,
                                function ()
                                {
                                  this._setFieldOfView();
                                }.bind(this));

          this.viewer.subscribe(cadc.vot.events.onFilterData,
                                function (event, args)
                                {
                                  this.reset();

                                  var v = args.application;
                                  var data = v.getGrid().getData();
                                  var currentRows = data.getRows();
                                  var cdl = currentRows.length;

                                  if (inputs.maxRowCount && (cdl <= inputs.maxRowCount))
                                  {
                                    this._enableButton();

                                    for (var cdi = 0; cdi < cdl; cdi++)
                                    {
                                      this._handleAddFootprint(event, {
                                        rowData: currentRows[cdi]
                                      });
                                    }

                                    this._setFieldOfView();
                                  }
                                  else
                                  {
                                    this._disableButton();
                                  }
                                }.bind(this));
        }
      }

      if (inputs.onHover === true)
      {
        this.handler.subscribe(this.grid.onMouseEnter, this._handleMouseEnter);
        this.handler.subscribe(this.grid.onMouseLeave, this._handleMouseLeave);
      }

      if (inputs.onClick === true)
      {
        this.handler.subscribe(this.grid.onClick, this._handleClick);
      }
    };

    /**
     * Remove all footprints from the current viewer overlay.
     * @private
     */
    this._resetCurrent = function ()
    {
      if (this.currentFootprint)
      {
        this.currentFootprint.removeAll();
      }
    };

    /**
     * Allow callers to bring this viewer around to an initial state.
     */
    this.reset = function ()
    {
      this.aladinOverlay.removeAll();
      this.currentFootprint.removeAll();

      this.fieldOfViewSetFlag = false;
      this.defaultRA = null;
      this.defaultDec = null;

      this._resetCurrent();
    };

    /**
     * Destroy this viewer.  Public method to allow callers to cleanup.
     */
    this.destroy = function ()
    {
      this.handler.unsubscribeAll();
      this.aladin = null;
      this.aladinOverlay = null;
      this.currentFootprint = null;
      this.$target.empty();
      this.defaultDec = null;
      this.defaultRA = null;
      this.fieldOfViewSetFlag = false;
      this.fovBox = {
        raLeft: null,
        raRight: null,
        decTop: null,
        decBottom: null
      };

      if (inputs.toggleSwitchSelector !== null)
      {
        $(inputs.toggleSwitchSelector).off("click");
      }

      if (this.viewer !== null)
      {
        this.viewer.unsubscribe(cadc.vot.events.onRowAdded);
        this.viewer.unsubscribe(cadc.vot.events.onDataLoaded);
      }

      this._toggleViewButton();
    };

    /**
     * Return the calculated maximums for a box.
     *
     * @param {String} _footprint    Footprint string of coordinates.
     * @returns {{maxRA: number, minRA: number, maxDec: number, minDec: number}}
     * @private
     */
    this._calculateFootprintFOV = function (_footprint)
    {
      var footprintItems = $.trim(_footprint).split(" ");
      var fl = footprintItems.length;
      var raValues = [];
      var decValues = [];

      for (var f = 0; f < fl; f++)
      {
        // Even numbers are RA values.
        if ((f % 2) === 0)
        {
          raValues.push(Number(footprintItems[f]));
        }
        else
        {
          decValues.push(Number(footprintItems[f]));
        }
      }

      return {
        maxRA: Math.max.apply(null, raValues),
        minRA: Math.min.apply(null, raValues),
        maxDec: Math.max.apply(null, decValues),
        minDec: Math.min.apply(null, decValues)
      };
    };

    /**
     * Update the current FOV box.
     *
     * @param {string} _footprint  The footprint string, with only coordinate points.
     * @private
     */
    this._updateFOV = function (_footprint)
    {
      var rowFOVBox = this._calculateFootprintFOV(_footprint);

      var maxRA = rowFOVBox.maxRA;
      var minRA = rowFOVBox.minRA;
      var maxDec = rowFOVBox.maxDec;
      var minDec = rowFOVBox.minDec;

      if ((this.fovBox.raLeft === null) || (this.fovBox.raLeft < maxRA))
      {
        this.fovBox.raLeft = maxRA;
      }

      if ((this.fovBox.raRight === null) || (this.fovBox.raRight > minRA))
      {
        this.fovBox.raRight = minRA;
      }

      if ((this.fovBox.decTop === null) || (this.fovBox.decTop < maxDec))
      {
        this.fovBox.decTop = maxDec;
      }

      if ((this.fovBox.decBottom === null) || (this.fovBox.decBottom > minDec))
      {
        this.fovBox.decBottom = minDec;
      }
    };

    /**
     * Sanitize the given footprint to remove spaces and non-numerical data as per the Aladin viewer's requirements.
     *
     * @param nextFootprint   The source footprint.
     * @returns {string}  Footprint string of data.
     * @private
     */
    this._sanitizeFootprint = function (nextFootprint)
    {
      var sanitizedFootprint;

      if ((nextFootprint !== null) && ($.trim(nextFootprint).length > 0))
      {
        var footprintElements = nextFootprint.split(/\s/);

        for (var fei = 0, fel = footprintElements.length; fei < fel; fei++)
        {
          var footprintElement = footprintElements[fei];

          if (isNaN(footprintElement))
          {
            delete footprintElements[fei];
          }
        }

        sanitizedFootprint = (footprintElements.length > 0) ? (POLYGON_SPLIT + footprintElements.join(" ")) : null;
      }
      else
      {
        sanitizedFootprint = null;
      }

      return sanitizedFootprint;
    };

    /**
     * Generic handler when something interacts with the Grid that needs to be reflected in the Footprint Viewer.
     * @param {{}} _dataRow   Row of data.
     * @private
     */
    this._handleAction = function (_dataRow)
    {
      var raValue = _dataRow[this.raFieldID];
      var decValue = _dataRow[this.decFieldID];

      if ((raValue !== null) && ($.trim(raValue) !== "") && (decValue !== null) && ($.trim(decValue) !== ""))
      {
        var selectedFootprint = this._sanitizeFootprint(_dataRow[this.footprintFieldID]);

        if (selectedFootprint !== null)
        {
          this.currentFootprint.addFootprints(this.aladin.createFootprintsFromSTCS(selectedFootprint));

          if (inputs.navigateToSelected === true)
          {
            this.aladin.gotoRaDec(raValue, decValue);

            var selectedRowFOVBox = this._calculateFootprintFOV(selectedFootprint.substr(POLYGON_SPLIT.length));
            var fieldOfView = Math.max((selectedRowFOVBox.maxRA - selectedRowFOVBox.minRA),
                                       (selectedRowFOVBox.maxDec - selectedRowFOVBox.minDec));
            this.aladin.setFoV(Math.min(DEFAULT_FOV_DEGREES, inputs.afterFOVCalculation(fieldOfView)));
          }
        }
        else
        {
          console.warn("Unable to add footprint for (" + raValue + ", " + decValue + ")");
        }
      }
      else
      {
        console.warn("RA and Dec are invalid.");
      }

      if (this.aladin && this.aladin.view)
      {
        this.aladin.view.forceRedraw();
      }
    };

    /**
     * Handler called when the Grid is clicked.  Used for click interaction.
     * @param {jQuery.Event|Event} e  Event object.
     * @param {{}} args  Arguments.
     * @param {number} args.row   Row index.
     * @param {Slick.Grid} args.grid   Slick Grid instance.
     * @private
     */
    this._handleClick = function (e, args)
    {
      this._resetCurrent();
      this._handleAction(args.grid.getDataItem(args.row));
    };

    /**
     * Handler called when a mouse enters the Grid.  Used for hover interaction.
     * @private
     */
    this._handleMouseEnter = function (e, args)
    {
      this._handleAction(args.grid.getDataItem(args.cell.row));
    };

    /**
     * Handler called when a mouse leaves the Grid.  Used for hover interaction.
     * @private
     */
    this._handleMouseLeave = function ()
    {
      this._resetCurrent();
    };

    /**
     * Handler called when a footprint has been added to the viewer's overlay.
     * @param {jQuery.Event|Event}  e   Event object.
     * @param {{}}  args  Arguments.
     * @param {{}}  args.rowData    Row data hash.
     * @private
     */
    this._handleAddFootprint = function (e, args)
    {
      var _row = args.rowData;
      var polygonValue = _row[this.footprintFieldID];
      var raValue = $.trim(_row[this.raFieldID]);
      var decValue = $.trim(_row[this.decFieldID]);

      // Set the default location to the first item we see.
      if ((this.defaultRA === null) && (raValue !== null) && (raValue !== ""))
      {
        this.defaultRA = raValue;
      }

      if ((this.defaultDec === null) && (decValue !== null) && (decValue !== ""))
      {
        this.defaultDec = decValue;
      }

      if (polygonValue !== null)
      {
        var footprintValues = polygonValue.split(POLYGON_SPLIT);
        var footprintValuesLength = footprintValues.length;

        for (var fpvi = 0; fpvi < footprintValuesLength; fpvi++)
        {
          var nextFootprint = _sanitizeFootprint(footprintValues[fpvi]);

          if (nextFootprint !== null)
          {
            this.aladinOverlay.addFootprints(this.aladin.createFootprintsFromSTCS(nextFootprint));

            if (!inputs.fov || (inputs.fov === null))
            {
              this._updateFOV(nextFootprint.substr(POLYGON_SPLIT.length));
            }
          }
        }
      }
    };

    /**
     * Set the Field of View.  This is used when the data is done loading completely, or the data has filtered down.
     *
     * This assumes the fovBox has been built up using the _updateFOV method.
     *
     * @private
     */
    this._setFieldOfView = function()
    {
      var fieldOfView = Math.max((this.fovBox.raLeft - this.fovBox.raRight),
                                 (this.fovBox.decTop - this.fovBox.decBottom));
      this.aladin.setFoV(Math.min(DEFAULT_FOV_DEGREES, inputs.afterFOVCalculation(fieldOfView)));
      this.fieldOfViewSetFlag = true;

      if ((this.defaultRA !== null) && (this.defaultDec !== null))
      {
        this.aladin.gotoRaDec(this.defaultRA, this.defaultDec);
      }
    };

    /**
     * Called when Grid rendering has completed.
     *
     * @param {jQuery.Event|Event}  e   Event object.
     * @param {{}}  args    Arguments from the Grid.
     * @param {Slick.Grid}  args.grid   Slick.Grid instance.
     * @private
     */
    this._handleRenderComplete = function(e, args)
    {
      if (inputs.renderedRowsOnly === true)
      {
        this.reset();

        var renderedRange = args.grid.getRenderedRange();

        for (var i = renderedRange.top, ii = renderedRange.bottom; i < ii; i++)
        {
          this._handleAddFootprint(e, {rowData: args.grid.getDataItem(i)});
        }
      }

      if (this.fieldOfViewSetFlag === false)
      {
        this._setFieldOfView();
      }
    };

    /**
     * Enable the show/hide button.
     * @private
     */
    this._enableButton = function ()
    {
      this.viewAladinButton.removeClass("ui-disabled");
      this.viewAladinStatus.addClass("wb-invisible");
    };

    /**
     * Disable the show/hide button.
     * @private
     */
    this._disableButton = function ()
    {
      this.viewAladinButton.addClass("ui-disabled");
      this.viewAladinStatus.removeClass("wb-invisible");
      inputs.toggleClose($(inputs.toggleSwitchSelector));
      this.$target.hide();
    };

    /**
     * Toggle hiding/viewing the button that shows/hides the footprint viewer.
     * @private
     */
    this._toggleViewButton = function ()
    {
      if (inputs.toggleSwitchSelector !== null)
      {
        if (this.$target.is(":visible"))
        {
          inputs.toggleOpen($(inputs.toggleSwitchSelector));
        }
        else
        {
          inputs.toggleClose($(inputs.toggleSwitchSelector));
        }
      }
    };

    /**
     * Toggle hiding/showing of the footprint viewer.
     * @private
     */
    this._toggleView = function ()
    {
      if (this.viewer && this.grid && inputs.resizeCalculation)
      {
        inputs.resizeCalculation();
      }
    };
  }
})(jQuery, A);
