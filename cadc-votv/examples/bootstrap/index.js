"use strict";

(function ()
{
  var $ = require("jquery");
  var opencadcViewer = require("opencadc-votable-viewer");

  $(document).ready(function ()
                    {
                      var tableMetadata = new opencadcVOTable.Metadata(null, null, null);

                      var _selector = new opencadcVOTable.Field("_checkbox_selector", "_checkbox_selector",
                                                                "UCD_SELECT", "UTYPE_SELECT", null, null, null, null,
                                                                null, "_checkbox_select");
                      var name = new opencadcVOTable.Field("Name", "Name", "UCD1", "UTYPE1", "UNIT1",
                                                           null, null, null, null, "Name");
                      var location = new opencadcVOTable.Field("Location", "Location", "UCD2", "UTYPE2", "UNIT2",
                                                               null, null, null, null, "Location");
                      var astronomy = new opencadcVOTable.Field("Astronomy", "Astronomy", "UCD3", "UTYPE3", "UNIT3",
                                                                null, null, null, null, "Astronomy");
                      var telescope = new opencadcVOTable.Field("Telescope", "Telescope", "UCD3", "UTYPE3", "UNIT3",
                                                                null, null, null, null, "Telescope");

                      tableMetadata.addField(_selector);
                      tableMetadata.addField(name);
                      tableMetadata.addField(location);
                      tableMetadata.addField(astronomy);
                      tableMetadata.addField(telescope);

                      // List the running VMs and load them into the running VMs tab.
                      var options = {
                        editable: false,
                        enableAddRow: false,
                        showHeaderRow: true,
                        forceFitColumns: true,
                        enableCellNavigation: true,
                        asyncEditorLoading: true,
                        explicitInitialization: true,
                        columnFilterPluginName: "suggest",
                        headerRowHeight: 40,
                        showTopPanel: false,
                        sortColumn: "Started on",
                        defaultColumnWidth: 80,
                        sortDir: "desc",
                        rerenderOnResize: false,
                        pager: false,
                        gridResizable: true,
                        columnManager: {
                          filterable: true,
                          filterReturnCount: 10,
                          forceFitColumnMode: "max",
                          forceFitColumns: true,
                          resizable: true
                        },
                        columnOptions: {
                          "Astronomy": {
                            cssClass: "text-warning"
                          },
                          "_checkbox_select": {
                            fitMax: false,
                            filterable: false
                          }
                        }
                      };

                      var showTable = function (csvData)
                      {
                        var viewer = new opencadcViewer.Viewer("#myGrid", options);

                        viewer.subscribe(opencadcViewer.events.onDataLoaded, function ()
                        {
                          this.render();
                          this.refreshGrid();
                        });

                        viewer.build({
                                       data: csvData,
                                       type: "csv",
                                       pageSize: 10,
                                       tableMetadata: tableMetadata
                                     });
                      };

                      var csvData = "ID, Name, Location, Astronomy, Telescope\n"
                                    +
                                    "100, Phil Orbit, Mauna Kea, Optical, CHFT\n"
                                    + "101, Chad Sky, Atacama, Radio, ALMA\n"
                                    +
                                    "102, Carrie Redshift, Mauna Kea, Optical, JCMT\n"
                                    +
                                    "103, Mary Declination, Montreal, Optical, OOM\n"
                                    +
                                    "104, Peter Wavelength, Australia, Radio, SKA";
                      showTable(csvData);
                    });
})();
