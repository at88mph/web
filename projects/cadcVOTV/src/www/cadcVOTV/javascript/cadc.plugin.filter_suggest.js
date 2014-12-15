/**
 * CADC VOTable viewer plugin to hook into the filter input boxes to suggest
 * data from the grid as the user types.
 *
 * @param _viewer     The cadc.vot.Viewer object containing data.
 *
 * jenkinsd 2014.12.01
 */
(function ($)
{
  // register namespace
  $.extend(true, $.fn, {
    "cadcVOTV_filter_suggest": cadcVOTV_filter_suggest
  });
B

  /**
   * Make use of autocomplete suggestions on filtering.
   *
   * @param _viewer           The VOTable viewer object.
   * @constructor
   */
  function cadcVOTV_filter_suggest(_viewer)
  {
    var $inputField = $(this);
    var suggestionKeys = [];
    var columnID = $inputField.data("columnId");

    /**
     * Ensure unique values in an array.
     *
     * @param value       A value to check.
     * @param index       The index of the current value.
     * @param self        This array.
     * @returns {boolean} If it needs to be omitted.
     */
    function onlyUnique(value, index, self)
    {
      return self.indexOf(value) === index;
    }

    function filter(val, closeAutocompleteFlag)
    {
      if (closeAutocompleteFlag)
      {
        $inputField.autocomplete("close");
      }

      _viewer.doFilter(val, columnID);
    }

    $inputField.on("change keyup", function(event)
    {
      var trimmedVal = $.trim($inputField.val());

      // Clear it if the input is cleared.
      if (!trimmedVal || (trimmedVal === ''))
      {
        filter("");
      }
    });

    // Autocomplete the items from the Grid's data.
    $inputField.autocomplete({
                               // Define the minimum search string length
                               // before the suggested values are shown.
                               minLength: 1,

                               // Define callback to format results
                               source: function (req, callback)
                               {
                                 var column = _viewer.getColumn(columnID);
                                 var enteredValue = req.term;

                                 // Reset each time as they type.
                                 suggestionKeys = [];

                                 // Conditional logic to not use autocomplete, such as range searches.
                                 var trimmedVal = $.trim(enteredValue);
                                 var space = " ";
                                 var numericRangeSearchRegex = /^(>|<|=)/i;
                                 var rangeSearchString = "..";
                                 var endsWithSpace =
                                     (enteredValue.indexOf(space,
                                                           (enteredValue.length - space.length)) !== -1);

                                 // Ends with space, so exact match.
                                 if (endsWithSpace
                                     || trimmedVal.match(numericRangeSearchRegex)
                                     || (trimmedVal.indexOf(rangeSearchString) !== -1))
                                 {
                                   filter(trimmedVal, true);
                                 }
                                 // Clear it if the input is cleared.
                                 else if (!trimmedVal || (trimmedVal === ''))
                                 {
                                   filter("", true);
                                 }
                                 else
                                 {
                                   var grid = _viewer.getGrid();
                                   var dataView = grid.getData();
                                   var ii;

                                   for (ii = 0; ii < dataView.getLength(); ii++)
                                   {
                                     var item = dataView.getItem(ii);
                                     var columnFilterObject = {};
                                     columnFilterObject[columnID] = enteredValue;

                                     if (_viewer.searchFilter(
                                               item,
                                                    {
                                                      columnFilters: columnFilterObject,
                                                      grid: grid,
                                                      doFilter: _viewer.valueFilters,
                                                      formatCellValue: _viewer.formatCellValue
                                                    }))
                                            {
                                              suggestionKeys.push(_viewer.formatCellValue(item, grid, columnID));
                                            }
                                   }
                                 }

                                 var uniqueKeys = suggestionKeys.filter(onlyUnique);
                                 // For a single available value, pre select it.
                                 if (uniqueKeys.length == 1)
                                 {  
                                   filter(uniqueKeys[0], false);
                                 }

                                 callback(uniqueKeys);
                               },
                               select: function (event, ui)
                               {
                                 filter(($.trim(ui.item.value) || ""), true);
                               }
                             });

    return this;
  }
})(jQuery);

